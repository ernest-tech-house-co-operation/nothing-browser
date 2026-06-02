// piggy/client/index.js
import { connect } from "net";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { platform } from "os";
import logger from "../logger/index.js";

const DEFAULT_SOCKET_PATH = platform() === "win32"
  ? "\\\\.\\pipe\\piggy"
  : "/tmp/piggy";

// ── Socket transport ───────────────────────────────────────────────────────────

class SocketTransport {
  constructor(sock) {
    this.sock = sock;
  }

  send(data) {
    this.sock.write(data);
  }

  on(event, handler) {
    this.sock.on(event, handler);
  }

  destroy() {
    this.sock.destroy();
  }
}

// ── HTTP transport ─────────────────────────────────────────────────────────────

class HttpTransport {
  constructor(host, key) {
    this.host = host.replace(/\/$/, "");
    this.key = key;
    this.dataHandlers = [];
    this.errorHandlers = [];
    this.closeHandlers = [];
    this._destroyed = false;
  }

  on(event, handler) {
    if (event === "data")  this.dataHandlers.push(handler);
    if (event === "error") this.errorHandlers.push(handler);
    if (event === "close") this.closeHandlers.push(handler);
  }

  send(data) {
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
        const lines = text.split("\n").filter(l => l.trim());
        for (const line of lines) {
          this.dataHandlers.forEach(h => h(line + "\n"));
        }
      })
      .catch((e) => {
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
  constructor(arg) {
    if (arg && typeof arg === "object") {
      this.socketPath = "";
      this.httpHost = arg.host.replace(/\/$/, "");
      this.httpKey = arg.key;
    } else {
      this.socketPath = arg ?? DEFAULT_SOCKET_PATH;
    }
    this.reqId = 0;
    this.pending = new Map();
    this.buf = "";
    this.eventHandlers = new Map();
    this.globalEventHandlers = new Map();
    this.eventHandlers.set("default", new Map());
  }

  // ── Connect ───────────────────────────────────────────────────────────────

  connect() {
    if (this.httpHost) return this._connectHttp();
    return this._connectSocket();
  }

  _connectSocket() {
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

  async _connectHttp() {
    logger.info(`Connecting to Piggy server (HTTP): ${this.httpHost}`);
    try {
      const res = await fetch(this.httpHost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Piggy-Key": this.httpKey,
        },
        body: "hello",
      });
      if (res.status === 401) {
        throw new Error("Unauthorized — invalid X-Piggy-Key");
      }
      this.transport = new HttpTransport(this.httpHost, this.httpKey);
      this._wireTransport();
      logger.success(`Connected to Piggy server (HTTP): ${this.httpHost}`);
    } catch (e) {
      throw new Error(`Failed to connect to Piggy HTTP server: ${e.message}`);
    }
  }

  _wireTransport() {
    if (!this.transport) return;

    this.transport.on("data", (chunk) => {
      this.buf += chunk;
      const lines = this.buf.split("\n");
      this.buf = lines.pop();

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

    this.transport.on("error", (e) => {
      for (const p of this.pending.values()) p.reject(e);
      this.pending.clear();
    });

    this.transport.on("close", () => {
      for (const p of this.pending.values()) p.reject(new Error("Connection closed"));
      this.pending.clear();
    });
  }

  // ── Event handling ────────────────────────────────────────────────────────

  handleEvent(event) {
    if (event.event === "exposed_call") {
      const { tabId, name, callId, data } = event;
      const effectiveTabId = tabId || "default";
      const handlers = this.eventHandlers.get(effectiveTabId);
      const handler = handlers?.get(name);

      if (handler) {
        let parsedData;
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

    if (event.event === "dialog") {
      const key = `dialog:${event.tabId ?? "default"}`;
      const handlers = this.globalEventHandlers.get(key);
      if (handlers) {
        for (const h of handlers) {
          try {
            h({
              dialogType:   event.dialogType,
              message:      event.message,
              defaultValue: event.defaultValue,
              tabId:        event.tabId,
            });
          } catch (e) { logger.error(`dialog handler error: ${e}`); }
        }
      }
    }
  }

  onEvent(eventName, tabId, handler) {
    const key = `${eventName}:${tabId}`;
    if (!this.globalEventHandlers.has(key)) {
      this.globalEventHandlers.set(key, new Set());
    }
    this.globalEventHandlers.get(key).add(handler);
    return () => this.globalEventHandlers.get(key)?.delete(handler);
  }

  disconnect() {
    this.transport?.destroy();
    this.transport = null;
  }

  // ── Core send ─────────────────────────────────────────────────────────────

  send(cmd, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.transport) return reject(new Error("Not connected"));
      const id = String(++this.reqId);
      this.pending.set(id, { resolve, reject });
      this.transport.send(JSON.stringify({ id, cmd, payload }) + "\n");
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  async newTab() { return this.send("tab.new", {}); }
  async closeTab(tabId) { await this.send("tab.close", { tabId }); }
  async listTabs() { return this.send("tab.list", {}); }

  // ── Navigation ────────────────────────────────────────────────────────────
  async navigate(url, tabId = "default") { await this.send("navigate", { url, tabId }); }
  async reload(tabId = "default") { await this.send("reload", { tabId }); }
  async goBack(tabId = "default") { await this.send("go.back", { tabId }); }
  async goForward(tabId = "default") { await this.send("go.forward", { tabId }); }

  // ── Page info ─────────────────────────────────────────────────────────────
  async getTitle(tabId = "default") { return this.send("page.title", { tabId }); }
  async getUrl(tabId = "default") { return this.send("page.url", { tabId }); }
  async content(tabId = "default") { return this.send("page.content", { tabId }); }

  // ── Eval / JS ─────────────────────────────────────────────────────────────
  async evaluate(js, tabId = "default") { return this.send("evaluate", { js, tabId }); }
  async addInitScript(js, tabId = "default") { await this.send("addInitScript", { js, tabId }); }

  // ── Interactions ──────────────────────────────────────────────────────────
  async click(selector, tabId = "default") { return this.send("click", { selector, tabId }); }
  async doubleClick(selector, tabId = "default") { return this.send("dblclick", { selector, tabId }); }
  async hover(selector, tabId = "default") { return this.send("hover", { selector, tabId }); }
  async type(selector, text, tabId = "default") { return this.send("type", { selector, text, tabId }); }
  async select(selector, value, tabId = "default") { return this.send("select", { selector, value, tabId }); }
  async keyPress(key, tabId = "default") { return this.send("keyboard.press", { key, tabId }); }
  async keyCombo(combo, tabId = "default") { return this.send("keyboard.combo", { combo, tabId }); }
  async mouseMove(x, y, tabId = "default") { return this.send("mouse.move", { x, y, tabId }); }
  async mouseDrag(from, to, tabId = "default") { return this.send("mouse.drag", { from, to, tabId }); }

  // ── Scroll ────────────────────────────────────────────────────────────────
  async scrollTo(selector, tabId = "default") { return this.send("scroll.to", { selector, tabId }); }
  async scrollBy(px, tabId = "default") { return this.send("scroll.by", { px, tabId }); }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async fetchText(query, tabId = "default") { return this.send("fetch.text", { query, tabId }); }
  async fetchLinks(query, tabId = "default") {
    if (query === "a" || query === "body") {
      const result = await this.send("fetch.links.all", { tabId });
      return Array.isArray(result) ? result : [];
    }
    const result = await this.send("fetch.links", { query, tabId });
    return Array.isArray(result) ? result : [];
  }
  async fetchImages(query, tabId = "default") {
    const result = await this.send("fetch.image", { query, tabId });
    return Array.isArray(result) ? result : [];
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async searchCss(query, tabId = "default") { return this.send("search.css", { query, tabId }); }
  async searchId(query, tabId = "default") { return this.send("search.id", { query, tabId }); }

  // ── Wait ──────────────────────────────────────────────────────────────────
  async waitForSelector(selector, timeout = 30000, tabId = "default") { await this.send("wait.selector", { selector, timeout, tabId }); }
  async waitForNavigation(tabId = "default") { await this.send("wait.navigation", { tabId }); }
  async waitForResponse(urlPattern, timeout = 30000, tabId = "default") { await this.send("wait.response", { url: urlPattern, timeout, tabId }); }

  // ── Screenshot / PDF ──────────────────────────────────────────────────────
  async screenshot(filePath, tabId = "default") {
    const b64 = await this.send("screenshot", { tabId });
    if (filePath) { mkdirSync(dirname(filePath), { recursive: true }); writeFileSync(filePath, Buffer.from(b64, "base64")); }
    return filePath ?? b64;
  }
  async pdf(filePath, tabId = "default") {
    const b64 = await this.send("pdf", { tabId });
    if (filePath) { mkdirSync(dirname(filePath), { recursive: true }); writeFileSync(filePath, Buffer.from(b64, "base64")); }
    return filePath ?? b64;
  }

  // ── Image blocking ────────────────────────────────────────────────────────
  async blockImages(tabId = "default") { await this.send("intercept.block.images", { tabId }); }
  async unblockImages(tabId = "default") { await this.send("intercept.unblock.images", { tabId }); }

  // ── Cookies ───────────────────────────────────────────────────────────────
  async setCookie(name, value, domain, path = "/", tabId = "default") { await this.send("cookie.set", { name, value, domain, path, tabId }); }
  async getCookie(name, domain = "", tabId = "default") { return this.send("cookie.get", { name, domain, tabId }); }
  async deleteCookie(name, domain, tabId = "default") { await this.send("cookie.delete", { name, domain, tabId }); }
  async listCookies(domain = "", tabId = "default") { return this.send("cookie.list", { domain, tabId }); }

  // ── Interception ──────────────────────────────────────────────────────────
  async addInterceptRule(action, pattern, options = {}, tabId = "default") {
    await this.send("intercept.rule.add", { action, pattern, ...options, tabId });
  }
  async clearInterceptRules(tabId = "default") { await this.send("intercept.rule.clear", { tabId }); }

  // ── Network capture ───────────────────────────────────────────────────────
  async captureStart(tabId = "default") { await this.send("capture.start", { tabId }); }
  async captureStop(tabId = "default") { await this.send("capture.stop", { tabId }); }
  async captureRequests(tabId = "default") { return this.send("capture.requests", { tabId }); }
  async captureWs(tabId = "default") { return this.send("capture.ws", { tabId }); }
  async captureCookies(tabId = "default") { return this.send("capture.cookies", { tabId }); }
  async captureStorage(tabId = "default") { return this.send("capture.storage", { tabId }); }
  async captureClear(tabId = "default") { await this.send("capture.clear", { tabId }); }

  // ── Session ───────────────────────────────────────────────────────────────
  async sessionExport(tabId = "default") { return this.send("session.export", { tabId }); }
  async sessionImport(data, tabId = "default") { await this.send("session.import", { data, tabId }); }

  async sessionWsSave(enabled = true) { await this.send("session.ws.save", { enabled }); }
  async sessionPingsSave(enabled = true) { await this.send("session.pings.save", { enabled }); }
  async sessionPaths() { return this.send("session.paths", {}); }
  async sessionCookiesPath() { return this.send("session.cookies.path", {}); }
  async sessionProfilePath() { return this.send("session.profile.path", {}); }
  async sessionWsPath() { return this.send("session.ws.path", {}); }
  async sessionPingsPath() { return this.send("session.pings.path", {}); }
  async sessionReload() { await this.send("session.reload", {}); }

  // ── Expose Function ───────────────────────────────────────────────────────
  async exposeFunction(name, handler, tabId = "default") {
    if (!this.eventHandlers.has(tabId)) this.eventHandlers.set(tabId, new Map());
    this.eventHandlers.get(tabId).set(name, async (data) => {
      try {
        const result = await handler(data);
        if (result && typeof result === "object" && ("success" in result || "error" in result)) return result;
        return { success: true, result };
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
    await this.send("expose.function", { name, tabId });
    logger.success(`[${tabId}] exposed function: ${name}`);
  }

  async unexposeFunction(name, tabId = "default") {
    const handlers = this.eventHandlers.get(tabId);
    if (handlers) handlers.delete(name);
    logger.info(`[${tabId}] unexposed function: ${name}`);
  }

  async clearExposedFunctions(tabId = "default") {
    this.eventHandlers.set(tabId, new Map());
    logger.info(`[${tabId}] cleared all exposed functions`);
  }

  // ── Proxy ─────────────────────────────────────────────────────────────────
  async proxyLoad(path) { await this.send("proxy.load", { path }); }
  async proxyFetch(url) { await this.send("proxy.fetch", { url }); }
  async proxyOvpn(path) { await this.send("proxy.ovpn", { path }); }

  async proxySet(opts) {
    await this.send("proxy.set", opts);
  }

  async proxyTest() { await this.send("proxy.test", {}); }
  async proxyTestStop() { await this.send("proxy.test.stop", {}); }
  async proxyNext() { await this.send("proxy.next", {}); }
  async proxyDisable() { await this.send("proxy.disable", {}); }
  async proxyEnable() { await this.send("proxy.enable", {}); }

  async proxyCurrent() { return this.send("proxy.current", {}); }
  async proxyStats() { return this.send("proxy.stats", {}); }
  async proxyList(limit) { return this.send("proxy.list", limit !== undefined ? { limit } : {}); }
  async proxyRotation(mode, interval) {
    await this.send("proxy.rotation", { mode, ...(interval !== undefined ? { interval } : {}) });
  }
  async proxyConfig(opts) {
    await this.send("proxy.config", opts);
  }
  async proxySave(path, filter = "all") { await this.send("proxy.save", { path, filter }); }

  onProxyEvent(event, handler) {
    return this.onEvent(event, "*", handler);
  }
}