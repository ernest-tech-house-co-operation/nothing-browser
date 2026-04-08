// piggy/client/index.ts
import { connect, type Socket } from "net";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import logger from "../logger";

export class PiggyClient {
  private socketPath: string;
  private socket: Socket | null = null;
  private reqId = 0;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private buf = "";

  constructor(socketPath = "/tmp/piggy") {
    this.socketPath = socketPath;
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
        this.buf += chunk;
        const lines = this.buf.split("\n");
        this.buf = lines.pop()!;
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
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

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
  }

  private send<T = any>(cmd: string, payload: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Not connected"));
      const id = String(++this.reqId);
      this.pending.set(id, { resolve, reject });
      this.socket.write(JSON.stringify({ id, cmd, payload }) + "\n");
    });
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  async newTab(): Promise<string> {
    return this.send<string>("tab.new", {});
  }

  async closeTab(tabId: string): Promise<void> {
    await this.send("tab.close", { tabId });
  }

  async listTabs(): Promise<string[]> {
    return this.send<string[]>("tab.list", {});
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async navigate(url: string, tabId = "default"): Promise<void> {
    await this.send("navigate", { url, tabId });
  }

  async reload(tabId = "default"): Promise<void> {
    await this.send("reload", { tabId });
  }

  async goBack(tabId = "default"): Promise<void> {
    await this.send("go.back", { tabId });
  }

  async goForward(tabId = "default"): Promise<void> {
    await this.send("go.forward", { tabId });
  }

  // ── Page info ─────────────────────────────────────────────────────────────────

  async getTitle(tabId = "default"): Promise<string> {
    return this.send<string>("page.title", { tabId });
  }

  async getUrl(tabId = "default"): Promise<string> {
    return this.send<string>("page.url", { tabId });
  }

  async content(tabId = "default"): Promise<string> {
    return this.send<string>("page.content", { tabId });
  }

  // ── Eval / JS ─────────────────────────────────────────────────────────────────

  async evaluate(js: string, tabId = "default"): Promise<any> {
    return this.send("evaluate", { js, tabId });
  }

  // ── Interactions ──────────────────────────────────────────────────────────────

  async click(selector: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("click", { selector, tabId });
  }

  async doubleClick(selector: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("dblclick", { selector, tabId });
  }

  async hover(selector: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("hover", { selector, tabId });
  }

  async type(selector: string, text: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("type", { selector, text, tabId });
  }

  async select(selector: string, value: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("select", { selector, value, tabId });
  }

  async keyPress(key: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("keyboard.press", { key, tabId });
  }

  async keyCombo(combo: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("keyboard.combo", { combo, tabId });
  }

  async mouseMove(x: number, y: number, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("mouse.move", { x, y, tabId });
  }

  async mouseDrag(from: { x: number; y: number }, to: { x: number; y: number }, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("mouse.drag", { from, to, tabId });
  }

  // ── Scroll ────────────────────────────────────────────────────────────────────

  async scrollTo(selector: string, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("scroll.to", { selector, tabId });
  }

  async scrollBy(px: number, tabId = "default"): Promise<boolean> {
    return this.send<boolean>("scroll.by", { px, tabId });
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  async fetchText(query: string, tabId = "default"): Promise<string | null> {
    return this.send<string | null>("fetch.text", { query, tabId });
  }

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

  async searchCss(query: string, tabId = "default"): Promise<any> {
    return this.send("search.css", { query, tabId });
  }

  async searchId(query: string, tabId = "default"): Promise<any> {
    return this.send("search.id", { query, tabId });
  }

  // ── Wait ──────────────────────────────────────────────────────────────────────

  async waitForSelector(selector: string, timeout = 30000, tabId = "default"): Promise<void> {
    await this.send("wait.selector", { selector, timeout, tabId });
  }

  async waitForNavigation(tabId = "default"): Promise<void> {
    await this.send("wait.navigation", { tabId });
  }

  async waitForResponse(urlPattern: string, timeout = 30000, tabId = "default"): Promise<void> {
    await this.send("wait.response", { url: urlPattern, timeout, tabId });
  }

  // ── Screenshot ────────────────────────────────────────────────────────────────

  async screenshot(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.send<string>("screenshot", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
    }
    return filePath ?? b64;
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────

  async pdf(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.send<string>("pdf", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
    }
    return filePath ?? b64;
  }

  // ── Image blocking ────────────────────────────────────────────────────────────

  async blockImages(tabId = "default"): Promise<void> {
    await this.send("intercept.block.images", { tabId });
  }

  async unblockImages(tabId = "default"): Promise<void> {
    await this.send("intercept.unblock.images", { tabId });
  }

  // ── Cookies ───────────────────────────────────────────────────────────────────

  async setCookie(
    name: string,
    value: string,
    domain: string,
    path = "/",
    tabId = "default"
  ): Promise<void> {
    await this.send("cookie.set", { name, value, domain, path, tabId });
  }

  async getCookie(name: string, tabId = "default"): Promise<any> {
    return this.send("cookie.get", { name, tabId });
  }

  async deleteCookie(name: string, tabId = "default"): Promise<void> {
    await this.send("cookie.delete", { name, tabId });
  }

  async listCookies(tabId = "default"): Promise<any[]> {
    return this.send<any[]>("cookie.list", { tabId });
  }

  // ── Interception ──────────────────────────────────────────────────────────────

  async addInterceptRule(
    action: "block" | "redirect" | "modifyHeaders",
    pattern: string,
    options: { redirectUrl?: string; headers?: Record<string, string> } = {},
    tabId = "default"
  ): Promise<void> {
    await this.send("intercept.rule.add", { action, pattern, ...options, tabId });
  }

  async clearInterceptRules(tabId = "default"): Promise<void> {
    await this.send("intercept.rule.clear", { tabId });
  }

  // ── Network capture ───────────────────────────────────────────────────────────

  async captureStart(tabId = "default"): Promise<void> {
    await this.send("capture.start", { tabId });
  }

  async captureStop(tabId = "default"): Promise<void> {
    await this.send("capture.stop", { tabId });
  }

  async captureRequests(tabId = "default"): Promise<any[]> {
    return this.send<any[]>("capture.requests", { tabId });
  }

  async captureWs(tabId = "default"): Promise<any[]> {
    return this.send<any[]>("capture.ws", { tabId });
  }

  async captureCookies(tabId = "default"): Promise<any[]> {
    return this.send<any[]>("capture.cookies", { tabId });
  }

  async captureStorage(tabId = "default"): Promise<any> {
    return this.send("capture.storage", { tabId });
  }

  async captureClear(tabId = "default"): Promise<void> {
    await this.send("capture.clear", { tabId });
  }

  // ── Session ───────────────────────────────────────────────────────────────────

  async sessionExport(tabId = "default"): Promise<any> {
    return this.send("session.export", { tabId });
  }

  async sessionImport(data: any, tabId = "default"): Promise<void> {
    await this.send("session.import", { data, tabId });
  }
}