// piggy/client/index.ts
import { connect, type Socket } from "net";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { platform } from "os";
import logger from "../logger";

const SOCKET_PATH = platform() === 'win32'
  ? '\\\\.\\pipe\\piggy'
  : '/tmp/piggy';

export class PiggyClient {
  private socketPath: string;
  private socket: Socket | null = null;
  private reqId = 0;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private buf = "";
  private eventBuffer = "";
  private eventHandlers = new Map<string, Map<string, (data: any) => Promise<any>>>();
  private globalEventHandlers = new Map<string, Set<(data: any) => void>>();

  constructor(socketPath = SOCKET_PATH) {
    this.socketPath = socketPath;
    this.eventHandlers.set("default", new Map());
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Connecting to socket: ${this.socketPath}`);
      const sock = connect(this.socketPath);
      sock.setEncoding("utf8");

      sock.on("connect", () => {
        this.socket = sock;
        logger.success("Connected to Piggy server");
        resolve();
      });

      sock.on("data", (chunk: string) => {
        this.eventBuffer += chunk;
        const lines = this.eventBuffer.split("\n");
        this.eventBuffer = lines.pop()!;

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

      sock.on("error", (e) => {
        for (const p of this.pending.values()) p.reject(e);
        this.pending.clear();
        reject(e);
      });

      sock.on("close", () => {
        for (const p of this.pending.values()) p.reject(new Error("Socket closed"));
        this.pending.clear();
      });
    });
  }

  private handleEvent(event: any) {
    // ── exposed_call ──────────────────────────────────────────────────────────
    if (event.event === "exposed_call") {
      const { tabId, name, callId, data } = event;
      const effectiveTabId = tabId || "default";
      const handlers = this.eventHandlers.get(effectiveTabId);
      const handler = handlers?.get(name);

      if (handler) {
        // ✅ FIX: data can be a plain string (e.g., "OPENING") or JSON
        let parsedData;
        try {
          parsedData = JSON.parse(data || "null");
        } catch {
          parsedData = data; // fallback to raw string
        }

        Promise.resolve(handler(parsedData))
          .then(response => {
            if (response && typeof response === "object" && "success" in response) {
              this.send("exposed.result", {
                tabId: effectiveTabId,
                callId,
                result: response.success ? JSON.stringify(response.result) : (response.error || "Unknown error"),
                isError: !response.success
              }).catch(e => logger.error(`Failed to send exposed result: ${e}`));
            } else {
              this.send("exposed.result", {
                tabId: effectiveTabId,
                callId,
                result: JSON.stringify(response),
                isError: false
              }).catch(e => logger.error(`Failed to send exposed result: ${e}`));
            }
          })
          .catch(err => {
            this.send("exposed.result", {
              tabId: effectiveTabId,
              callId,
              result: err.message || "Handler error",
              isError: true
            }).catch(e => logger.error(`Failed to send exposed error: ${e}`));
          });
      } else {
        logger.warn(`No handler for exposed function: ${name} in tab ${effectiveTabId}`);
      }
      return;
    }

    // ── navigate ──────────────────────────────────────────────────────────────
    if (event.event === "navigate") {
      const handlers = this.globalEventHandlers.get(`navigate:${event.tabId}`);
      if (handlers) {
        for (const h of handlers) {
          try { h(event.url); } catch (e) { logger.error(`navigate handler error: ${e}`); }
        }
      }
      // Also fire wildcard listeners (no tabId filter)
      const wildcard = this.globalEventHandlers.get("navigate:*");
      if (wildcard) {
        for (const h of wildcard) {
          try { h({ url: event.url, tabId: event.tabId }); } catch {}
        }
      }
      return;
    }
  }

  // ── Global event subscription ─────────────────────────────────────────────
  onEvent(eventName: string, tabId: string, handler: (data: any) => void): () => void {
    const key = `${eventName}:${tabId}`;
    if (!this.globalEventHandlers.has(key)) {
      this.globalEventHandlers.set(key, new Set());
    }
    this.globalEventHandlers.get(key)!.add(handler);
    // Return unsubscribe fn
    return () => this.globalEventHandlers.get(key)?.delete(handler);
  }

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
  }

  send<T = any>(cmd: string, payload: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Not connected"));
      const id = String(++this.reqId);
      this.pending.set(id, { resolve, reject });
      this.socket.write(JSON.stringify({ id, cmd, payload }) + "\n");
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  async newTab(): Promise<string> { return this.send<string>("tab.new", {}); }
  async closeTab(tabId: string): Promise<void> { await this.send("tab.close", { tabId }); }
  async listTabs(): Promise<string[]> { return this.send<string[]>("tab.list", {}); }

  // ── Navigation ────────────────────────────────────────────────────────────
  async navigate(url: string, tabId = "default"): Promise<void> { await this.send("navigate", { url, tabId }); }
  async reload(tabId = "default"): Promise<void> { await this.send("reload", { tabId }); }
  async goBack(tabId = "default"): Promise<void> { await this.send("go.back", { tabId }); }
  async goForward(tabId = "default"): Promise<void> { await this.send("go.forward", { tabId }); }

  // ── Page info ─────────────────────────────────────────────────────────────
  async getTitle(tabId = "default"): Promise<string> { return this.send<string>("page.title", { tabId }); }
  async getUrl(tabId = "default"): Promise<string> { return this.send<string>("page.url", { tabId }); }
  async content(tabId = "default"): Promise<string> { return this.send<string>("page.content", { tabId }); }

  // ── Eval / JS ─────────────────────────────────────────────────────────────
  async evaluate(js: string, tabId = "default"): Promise<any> { return this.send("evaluate", { js, tabId }); }
  async addInitScript(js: string, tabId = "default"): Promise<void> { await this.send("addInitScript", { js, tabId }); }

  // ── Interactions ──────────────────────────────────────────────────────────
  async click(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("click", { selector, tabId }); }
  async doubleClick(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("dblclick", { selector, tabId }); }
  async hover(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("hover", { selector, tabId }); }
  async type(selector: string, text: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("type", { selector, text, tabId }); }
  async select(selector: string, value: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("select", { selector, value, tabId }); }
  async keyPress(key: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("keyboard.press", { key, tabId }); }
  async keyCombo(combo: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("keyboard.combo", { combo, tabId }); }
  async mouseMove(x: number, y: number, tabId = "default"): Promise<boolean> { return this.send<boolean>("mouse.move", { x, y, tabId }); }
  async mouseDrag(from: { x: number; y: number }, to: { x: number; y: number }, tabId = "default"): Promise<boolean> { return this.send<boolean>("mouse.drag", { from, to, tabId }); }

  // ── Scroll ────────────────────────────────────────────────────────────────
  async scrollTo(selector: string, tabId = "default"): Promise<boolean> { return this.send<boolean>("scroll.to", { selector, tabId }); }
  async scrollBy(px: number, tabId = "default"): Promise<boolean> { return this.send<boolean>("scroll.by", { px, tabId }); }

  // ── Fetch ─────────────────────────────────────────────────────────────────
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

  // ── Search ────────────────────────────────────────────────────────────────
  async searchCss(query: string, tabId = "default"): Promise<any> { return this.send("search.css", { query, tabId }); }
  async searchId(query: string, tabId = "default"): Promise<any> { return this.send("search.id", { query, tabId }); }

  // ── Wait ──────────────────────────────────────────────────────────────────
  async waitForSelector(selector: string, timeout = 30000, tabId = "default"): Promise<void> { await this.send("wait.selector", { selector, timeout, tabId }); }
  async waitForNavigation(tabId = "default"): Promise<void> { await this.send("wait.navigation", { tabId }); }
  async waitForResponse(urlPattern: string, timeout = 30000, tabId = "default"): Promise<void> { await this.send("wait.response", { url: urlPattern, timeout, tabId }); }

  // ── Screenshot / PDF ──────────────────────────────────────────────────────
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

  // ── Image blocking ────────────────────────────────────────────────────────
  async blockImages(tabId = "default"): Promise<void> { await this.send("intercept.block.images", { tabId }); }
  async unblockImages(tabId = "default"): Promise<void> { await this.send("intercept.unblock.images", { tabId }); }

  // ── Cookies ───────────────────────────────────────────────────────────────
  async setCookie(name: string, value: string, domain: string, path = "/", tabId = "default"): Promise<void> { await this.send("cookie.set", { name, value, domain, path, tabId }); }
  async getCookie(name: string, tabId = "default"): Promise<any> { return this.send("cookie.get", { name, tabId }); }
  async deleteCookie(name: string, tabId = "default"): Promise<void> { await this.send("cookie.delete", { name, tabId }); }
  async listCookies(tabId = "default"): Promise<any[]> { return this.send<any[]>("cookie.list", { tabId }); }

  // ── Interception ──────────────────────────────────────────────────────────
  async addInterceptRule(action: "block" | "redirect" | "modifyHeaders", pattern: string, options: { redirectUrl?: string; headers?: Record<string, string> } = {}, tabId = "default"): Promise<void> {
    await this.send("intercept.rule.add", { action, pattern, ...options, tabId });
  }
  async clearInterceptRules(tabId = "default"): Promise<void> { await this.send("intercept.rule.clear", { tabId }); }

  // ── Network capture ───────────────────────────────────────────────────────
  async captureStart(tabId = "default"): Promise<void> { await this.send("capture.start", { tabId }); }
  async captureStop(tabId = "default"): Promise<void> { await this.send("capture.stop", { tabId }); }
  async captureRequests(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.requests", { tabId }); }
  async captureWs(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.ws", { tabId }); }
  async captureCookies(tabId = "default"): Promise<any[]> { return this.send<any[]>("capture.cookies", { tabId }); }
  async captureStorage(tabId = "default"): Promise<any> { return this.send("capture.storage", { tabId }); }
  async captureClear(tabId = "default"): Promise<void> { await this.send("capture.clear", { tabId }); }

  // ── Session ───────────────────────────────────────────────────────────────
  async sessionExport(tabId = "default"): Promise<any> { return this.send("session.export", { tabId }); }
  async sessionImport(data: any, tabId = "default"): Promise<void> { await this.send("session.import", { data, tabId }); }

  // ── Expose Function ───────────────────────────────────────────────────────
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
}