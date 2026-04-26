// piggy/client/index.ts
import { connect, type Socket } from "net";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { platform } from "os";
import logger from "../logger";

const DEFAULT_SOCKET_PATH = platform() === "win32"
  ? "\\\\.\\pipe\\piggy"
  : "/tmp/piggy";

// ── Transport interface ────────────────────────────────────────────────────────

interface Transport {
  send(data: string): void;
  on(event: "data", handler: (chunk: string) => void): void;
  on(event: "error", handler: (e: Error) => void): void;
  on(event: "close", handler: () => void): void;
  destroy(): void;
}

// ── Socket transport ───────────────────────────────────────────────────────────

class SocketTransport implements Transport {
  private sock: Socket;

  constructor(sock: Socket) {
    this.sock = sock;
  }

  send(data: string) {
    this.sock.write(data);
  }

  on(event: string, handler: any) {
    this.sock.on(event, handler);
  }

  destroy() {
    this.sock.destroy();
  }
}

// ── HTTP transport ─────────────────────────────────────────────────────────────
// Wraps the HTTP remote endpoint so it looks identical to the socket transport.
// The C++ server accepts the same { id, cmd, payload } JSON over HTTP POST.
// Responses come back as { id, ok, data } — same structure, different wire.

class HttpTransport implements Transport {
  private host: string;
  private key: string;
  private dataHandlers: ((chunk: string) => void)[] = [];
  private errorHandlers: ((e: Error) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private _destroyed = false;

  constructor(host: string, key: string) {
    // Normalize host — strip trailing slash
    this.host = host.replace(/\/$/, "");
    this.key = key;
  }

  // HTTP is request/response — there are no persistent data/close events.
  // We keep the interface compatible; socket-style events are no-ops here.
  on(event: string, handler: any) {
    if (event === "data")  this.dataHandlers.push(handler);
    if (event === "error") this.errorHandlers.push(handler);
    if (event === "close") this.closeHandlers.push(handler);
  }

  // send() is called by PiggyClient with a JSON line.
  // We POST it, get the response, and fire the data handler synchronously.
  send(data: string) {
    if (this._destroyed) return;

    fetch(this.host, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Piggy-Key": this.key,
      },
      body: data,
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => `HTTP ${res.status}`);
          this.errorHandlers.forEach(h =>
            h(new Error(`HTTP ${res.status}: ${text}`))
          );
          return;
        }
        const text = await res.text();
        // Server may return one or more newline-delimited JSON lines
        const lines = text.split("\n").filter(l => l.trim());
        for (const line of lines) {
          this.dataHandlers.forEach(h => h(line + "\n"));
        }
      })
      .catch((e: Error) => {
        if (!this._destroyed) {
          this.errorHandlers.forEach(h => h(e));
        }
      });
  }

  destroy() {
    this._destroyed = true;
    this.closeHandlers.forEach(h => h());
  }
}

// ── PiggyClient ────────────────────────────────────────────────────────────────

export class PiggyClient {
  private socketPath: string;
  private httpHost: string | null = null;
  private httpKey: string | null = null;
  private transport: Transport | null = null;
  private reqId = 0;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private buf = "";
  private eventHandlers = new Map<string, Map<string, (data: any) => Promise<any>>>();
  private globalEventHandlers = new Map<string, Set<(data: any) => void>>();

  // Socket mode constructor (default)
  constructor(socketPath?: string);
  // HTTP mode constructor
  constructor(opts: { host: string; key: string });

  constructor(arg?: string | { host: string; key: string }) {
    if (arg && typeof arg === "object") {
      this.socketPath = "";
      this.httpHost = arg.host.replace(/\/$/, "");
      this.httpKey = arg.key;
    } else {
      this.socketPath = (arg as string | undefined) ?? DEFAULT_SOCKET_PATH;
    }
    this.eventHandlers.set("default", new Map());
  }

  // ── Connect ──────────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    if (this.httpHost) {
      return this._connectHttp();
    }
    return this._connectSocket();
  }

  private _connectSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Connecting to socket: ${this.socketPath}`);
      const sock = connect(this.socketPath);
      sock.setEncoding("utf8");

      sock.on("connect", () => {
        this.transport = new SocketTransport(sock);
        this._wireTransport();
        logger.success("Connected to Piggy server (socket)");
        resolve();
      });

      sock.on("error", (e) => {
        for (const p of this.pending.values()) p.reject(e);
        this.pending.clear();
        reject(e);
      });
    });
  }

  private async _connectHttp(): Promise<void> {
    // Verify the server is alive and the key is valid before handing back
    logger.info(`Connecting to Piggy server (HTTP): ${this.httpHost}`);
    try {
      const res = await fetch(this.httpHost!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Piggy-Key": this.httpKey!,
        },
        body: "hello",
      });
      if (res.status === 401) {
        throw new Error("Unauthorized — invalid X-Piggy-Key");
      }
      this.transport = new HttpTransport(this.httpHost!, this.httpKey!);
      this._wireTransport();
      logger.success(`Connected to Piggy server (HTTP): ${this.httpHost}`);
    } catch (e: any) {
      throw new Error(`Failed to connect to Piggy HTTP server: ${e.message}`);
    }
  }

  private _wireTransport() {
    if (!this.transport) return;

    this.transport.on("data", (chunk: string) => {
      this.buf += chunk;
      const lines = this.buf.split("\n");
      this.buf = lines.pop()!;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          if (msg.type === "event") {
            this.handleEvent(msg);
            continue;
          }

          const p = this.pending.get(msg.id);
          if (p) {
            this.pending.delete(msg.id);
            msg.ok ? p.resolve(msg.data) : p.reject(new Error(msg.data ?? "command failed"));
          }
        } catch {
          logger.error(`Bad JSON from server: ${line}`);
        }
      }
    });

    this.transport.on("error", (e: Error) => {
      for (const p of this.pending.values()) p.reject(e);
      this.pending.clear();
    });

    this.transport.on("close", () => {
      for (const p of this.pending.values()) p.reject(new Error("Connection closed"));
      this.pending.clear();
    });
  }

  // ── Event handling ────────────────────────────────────────────────────────────

  private handleEvent(event: any) {
    if (event.event === "exposed_call") {
      const { tabId, name, callId, data } = event;
      const effectiveTabId = tabId || "default";
      const handlers = this.eventHandlers.get(effectiveTabId);
      const handler = handlers?.get(name);

      if (handler) {
        let parsedData: any;
        try {
          parsedData = JSON.parse(data || "null");
        } catch {
          parsedData = data;
        }

        Promise.resolve(handler(parsedData))
          .then(response => {
            if (response && typeof response === "object" && "success" in response) {
              this.send("exposed.result", {
                tabId: effectiveTabId,
                callId,
                result: response.success ? JSON.stringify(response.result) : (response.error || "Unknown error"),
                isError: !response.success,
              }).catch(e => logger.error(`Failed to send exposed result: ${e}`));
            } else {
              this.send("exposed.result", {
                tabId: effectiveTabId,
                callId,
                result: JSON.stringify(response),
                isError: false,
              }).catch(e => logger.error(`Failed to send exposed result: ${e}`));
            }
          })
          .catch(err => {
            this.send("exposed.result", {
              tabId: effectiveTabId,
              callId,
              result: err.message || "Handler error",
              isError: true,
            }).catch(e => logger.error(`Failed to send exposed error: ${e}`));
          });
      } else {
        logger.warn(`No handler for exposed function: ${name} in tab ${effectiveTabId}`);
      }
      return;
    }

    if (event.event === "navigate") {
      const handlers = this.globalEventHandlers.get(`navigate:${event.tabId}`);
      if (handlers) {
        for (const h of handlers) {
          try { h(event.url); } catch (e) { logger.error(`navigate handler error: ${e}`); }
        }
      }
      const wildcard = this.globalEventHandlers.get("navigate:*");
      if (wildcard) {
        for (const h of wildcard) {
          try { h({ url: event.url, tabId: event.tabId }); } catch {}
        }
      }
    }
  }

  onEvent(eventName: string, tabId: string, handler: (data: any) => void): () => void {
    const key = `${eventName}:${tabId}`;
    if (!this.globalEventHandlers.has(key)) {
      this.globalEventHandlers.set(key, new Set());
    }
    this.globalEventHandlers.get(key)!.add(handler);
    return () => this.globalEventHandlers.get(key)?.delete(handler);
  }

  disconnect() {
    this.transport?.destroy();
    this.transport = null;
  }

  // ── Core send ─────────────────────────────────────────────────────────────────

  send<T = any>(cmd: string, payload: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.transport) return reject(new Error("Not connected"));
      const id = String(++this.reqId);
      this.pending.set(id, { resolve, reject });
      this.transport.send(JSON.stringify({ id, cmd, payload }) + "\n");
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  async newTab(): Promise<string> { return this.send<string>("tab.new", {}); }
  async closeTab(tabId: string): Promise<void> { await this.send("tab.close", { tabId }); }
  async listTabs(): Promise<string[]> { return this.send<string[]>("tab.list", {}); }

  // ── Navigation ────────────────────────────────────────────────────────────────
  async navigate(url: string, tabId = "default"): Promise<void> { await this.send("navigate", { url, tabId }); }
  async reload(tabId = "default"): Promise<void> { await this.send("reload", { tabId }); }
  async goBack(tabId = "default"): Promise<void> { await this.send("go.back", { tabId }); }
  async goForward(tabId = "default"): Promise<void> { await this.send("go.forward", { tabId }); }

  // ── Page info ─────────────────────────────────────────────────────────────────
  async getTitle(tabId = "default"): Promise<string> { return this.send<string>("page.title", { tabId }); }
  async getUrl(tabId = "default"): Promise<string> { return this.send<string>("page.url", { tabId }); }
  async content(tabId = "default"): Promise<string> { return this.send<string>("page.content", { tabId }); }

  // ── Eval / JS ─────────────────────────────────────────────────────────────────
  async evaluate(js: string, tabId = "default"): Promise<any> { return this.send("evaluate", { js, tabId }); }
  async addInitScript(js: string, tabId = "default"): Promise<void> { await this.send("addInitScript", { js, tabId }); }

  // ── Interactions ──────────────────────────────────────────────────────────────
  async click(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("click", { selector, tabId }); }
  async doubleClick(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("dblclick", { selector, tabId }); }
  async hover(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("hover", { selector, tabId }); }
  async type(selector: string, text: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("type", { selector, text, tabId }); }
  async select(selector: string, value: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("select", { selector, value, tabId }); }
  async keyPress(key: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("keyboard.press", { key, tabId }); }
  async keyCombo(combo: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("keyboard.combo", { combo, tabId }); }
  async mouseMove(x: number, y: number, tabId = "default"): Promise<boolean> { return this.send<boolean>("mouse.move", { x, y, tabId }); }
  async mouseDrag(from: { x: number; y: number }, to: { x: number; y: number }, tabId = "default"): Promise<boolean> { return this.send<boolean>("mouse.drag", { from, to, tabId }); }

  // ── Scroll ────────────────────────────────────────────────────────────────────
  async scrollTo(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("scroll.to", { selector, tabId }); }
  async scrollBy(px: number, tabId = "default"): Promise<boolean> { return this.send<boolean>("scroll.by", { px, tabId }); }

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  async fetchText(query: string, tabId = "default"): Promise<string | null> { return this.send<string | null>("fetch.text", { query, tabId }); }
  async fetchLinks(query: string, tabId = "default"): Promise<string[]> {
    if (query === "a" || query === "body") {
      const result = await this.send<string[]>("fetch.links.all", { tabId });
      return Array.isArray(result) ? result : [];
    }
    const result = await this.send<string[]>("fetch.links", { query, tabId });
    return Array.isArray(result) ? result : [];
  }
  async fetchImages(query: string, tabId = "default"): Promise<string[]> {
    const result = await this.send<string[]>("fetch.image", { query, tabId });
    return Array.isArray(result) ? result : [];
  }

  // ── Search ────────────────────────────────────────────────────────────────────
  async searchCss(query: string, tabId = "default"): Promise<any> { return this.send("search.css", { query, tabId }); }
  async searchId(query: string, tabId = "default"): Promise<any> { return this.send("search.id", { query, tabId }); }

  // ── Wait ──────────────────────────────────────────────────────────────────────
  async waitForSelector(selector: string, timeout = 30000, tabId = "default"): Promise<void> { await this.send("wait.selector", { selector, timeout, tabId }); }
  async waitForNavigation(tabId = "default"): Promise<void> { await this.send("wait.navigation", { tabId }); }
  async waitForResponse(urlPattern: string, timeout = 30000, tabId = "default"): Promise<void> { await this.send("wait.response", { url: urlPattern, timeout, tabId }); }

  // ── Screenshot / PDF ──────────────────────────────────────────────────────────
  async screenshot(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.send<string>("screenshot", { tabId });
    if (filePath) { mkdirSync(dirname(filePath), { recursive: true }); writeFileSync(filePath, Buffer.from(b64, "base64")); }
    return filePath ?? b64;
  }
  async pdf(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.send<string>("pdf", { tabId });
    if (filePath) { mkdirSync(dirname(filePath), { recursive: true }); writeFileSync(filePath, Buffer.from(b64, "base64")); }
    return filePath ?? b64;
  }

  // ── Image blocking ────────────────────────────────────────────────────────────
  async blockImages(tabId = "default"): Promise<void> { await this.send("intercept.block.images", { tabId }); }
  async unblockImages(tabId = "default"): Promise<void> { await this.send("intercept.unblock.images", { tabId }); }

  // ── Cookies ───────────────────────────────────────────────────────────────────
  async setCookie(name: string, value: string, domain: string, path = "/", tabId = "default"): Promise<void> { await this.send("cookie.set", { name, value, domain, path, tabId }); }
  async getCookie(name: string, tabId = "default"): Promise<any> { return this.send("cookie.get", { name, tabId }); }
  async deleteCookie(name: string, tabId = "default"): Promise<void> { await this.send("cookie.delete", { name, tabId }); }
  async listCookies(tabId = "default"): Promise<any[]> { return this.send<any[]>("cookie.list", { tabId }); }

  // ── Interception ──────────────────────────────────────────────────────────────
  async addInterceptRule(action: "block" | "redirect" | "modifyHeaders", pattern: string, options: { redirectUrl?: string; headers?: Record<string, string> } = {}, tabId = "default"): Promise<void> {
    await this.send("intercept.rule.add", { action, pattern, ...options, tabId });
  }
  async clearInterceptRules(tabId = "default"): Promise<void> { await this.send("intercept.rule.clear", { tabId }); }

  // ── Network capture ───────────────────────────────────────────────────────────
  async captureStart(tabId = "default"): Promise<void> { await this.send("capture.start", { tabId }); }
  async captureStop(tabId = "default"): Promise<void> { await this.send("capture.stop", { tabId }); }
  async captureRequests(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.requests", { tabId }); }
  async captureWs(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.ws", { tabId }); }
  async captureCookies(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.cookies", { tabId }); }
  async captureStorage(tabId = "default"): Promise<any> { return this.send("capture.storage", { tabId }); }
  async captureClear(tabId = "default"): Promise<void> { await this.send("capture.clear", { tabId }); }

  // ── Session ───────────────────────────────────────────────────────────────────
  async sessionExport(tabId = "default"): Promise<any> { return this.send("session.export", { tabId }); }
  async sessionImport(data: any, tabId = "default"): Promise<void> { await this.send("session.import", { data, tabId }); }

  // ── Expose Function ───────────────────────────────────────────────────────────
  async exposeFunction(name: string, handler: (data: any) => Promise<any> | any, tabId = "default"): Promise<void> {
    if (!this.eventHandlers.has(tabId)) this.eventHandlers.set(tabId, new Map());
    this.eventHandlers.get(tabId)!.set(name, async (data: any) => {
      try {
        const result = await handler(data);
        if (result && typeof result === "object" && ("success" in result || "error" in result)) return result;
        return { success: true, result };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    });
    await this.send("expose.function", { name, tabId });
    logger.success(`[${tabId}] exposed function: ${name}`);
  }

  async unexposeFunction(name: string, tabId = "default"): Promise<void> {
    const handlers = this.eventHandlers.get(tabId);
    if (handlers) handlers.delete(name);
    logger.info(`[${tabId}] unexposed function: ${name}`);
  }

  async clearExposedFunctions(tabId = "default"): Promise<void> {
    this.eventHandlers.set(tabId, new Map());
    logger.info(`[${tabId}] cleared all exposed functions`);
  }

  // ── Proxy ─────────────────────────────────────────────────────────────────────

  // Load a proxy list file from disk (one proxy per line, any format)
  async proxyLoad(path: string): Promise<void> {
    await this.send("proxy.load", { path });
  }

  // Fetch a proxy list from a URL
  async proxyFetch(url: string): Promise<void> {
    await this.send("proxy.fetch", { url });
  }

  // Load an OpenVPN config file
  async proxyOvpn(path: string): Promise<void> {
    await this.send("proxy.ovpn", { path });
  }

  // Set a single proxy directly.
  // Pass { host, port, type, user?, pass? } OR { proxy: "socks5://user:pass@host:port" }
  async proxySet(opts: {
    host?: string;
    port?: number;
    type?: "http" | "https" | "socks5" | "socks4";
    user?: string;
    pass?: string;
    proxy?: string;
  }): Promise<void> {
    await this.send("proxy.set", opts as Record<string, any>);
  }

  // Health check all proxies in parallel (20 concurrent). Fires proxy:alive / proxy:dead events.
  async proxyTest(): Promise<void> {
    await this.send("proxy.test", {});
  }

  // Abort an in-progress proxy health check
  async proxyTestStop(): Promise<void> {
    await this.send("proxy.test.stop", {});
  }

  // Rotate to the next proxy in the list
  async proxyNext(): Promise<void> {
    await this.send("proxy.next", {});
  }

  // Disable proxy — use real IP
  async proxyDisable(): Promise<void> {
    await this.send("proxy.disable", {});
  }

  // Re-enable proxy after disable
  async proxyEnable(): Promise<void> {
    await this.send("proxy.enable", {});
  }

  // Get current proxy details + health status
  async proxyCurrent(): Promise<{
    host: string;
    port: number;
    type: string;
    user?: string;
    alive: boolean;
    latencyMs?: number;
  }> {
    return this.send("proxy.current", {});
  }

  // Get stats: total / alive / dead / current index / checking
  async proxyStats(): Promise<{
    total: number;
    alive: number;
    dead: number;
    index: number;
    checking: boolean;
  }> {
    return this.send("proxy.stats", {});
  }

  // List all proxies with per-entry health. Pass limit to cap the response.
  async proxyList(limit?: number): Promise<{
    host: string;
    port: number;
    type: string;
    alive: boolean;
    latencyMs?: number;
  }[]> {
    return this.send("proxy.list", limit !== undefined ? { limit } : {});
  }

  // Set rotation mode: "none" | "timed" | "perrequest"
  // interval is in milliseconds, only used for "timed" mode
  async proxyRotation(mode: "none" | "timed" | "perrequest", interval?: number): Promise<void> {
    await this.send("proxy.rotation", { mode, ...(interval !== undefined ? { interval } : {}) });
  }

  // Configure proxy behaviour
  async proxyConfig(opts: { skipDead?: boolean; autoCheck?: boolean }): Promise<void> {
    await this.send("proxy.config", opts as Record<string, any>);
  }

  // Save proxy list to file. filter: "alive" | "dead" | "all"
  async proxySave(path: string, filter: "alive" | "dead" | "all" = "all"): Promise<void> {
    await this.send("proxy.save", { path, filter });
  }

  // Subscribe to proxy events pushed from the server.
  // Events: proxy:loaded | proxy:changed | proxy:alive | proxy:dead |
  //         proxy:check:started | proxy:check:done | proxy:exhausted |
  //         proxy:fetch:failed | proxy:ovpn:loaded
  onProxyEvent(event: string, handler: (data: any) => void): () => void {
    return this.onEvent(event, "*", handler);
  }
}