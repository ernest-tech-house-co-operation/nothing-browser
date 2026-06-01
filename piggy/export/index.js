// piggy/export/index.js
import { PiggyClient } from "../client.js";

// ─── ExportClient ─────────────────────────────────────────────────────────────
export class ExportClient {
  constructor(client) {
    this.client = client;
  }

  // DOM fetch
  searchCss(query, tabId = "default") {
    return this.client.send("search.css", { query, tabId });
  }

  searchId(query, tabId = "default") {
    return this.client.send("search.id", { query, tabId });
  }

  // Cookies
  setCookie(opts, tabId = "default") {
    return this.client.send("cookie.set", { ...opts, tabId });
  }

  deleteCookie(opts, tabId = "default") {
    return this.client.send("cookie.delete", { ...opts, tabId });
  }

  // Session
  sessionReload(tabId = "default") {
    return this.client.send("session.reload", { tabId });
  }

  cookiesPath() {
    return this.client.send("session.cookies.path", {});
  }

  profilePath() {
    return this.client.send("session.profile.path", {});
  }

  wsPath() {
    return this.client.send("session.ws.path", {});
  }

  pingsPath() {
    return this.client.send("session.pings.path", {});
  }

  sessionPaths() {
    return this.client.send("session.paths", {});
  }

  setWsSave(enabled) {
    return this.client.send("session.ws.save", { enabled });
  }

  setPingsSave(enabled) {
    return this.client.send("session.pings.save", { enabled });
  }

  // Intercept rules
  addInterceptRule(rule, tabId = "default") {
    return this.client.send("intercept.rule.add", { ...rule, tabId });
  }

  clearInterceptRules(tabId = "default") {
    return this.client.send("intercept.rule.clear", { tabId });
  }

  // Session export / import
  async exportSession(tabId = "default") {
    const raw = await this.client.send("session.export", { tabId });
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  importSession(data, tabId = "default") {
    return this.client.send("session.import", {
      data: JSON.stringify(data),
      tabId,
    });
  }

  // Exposed functions
  exposeFunction(name, tabId = "default") {
    return this.client.send("expose.function", { name, tabId });
  }

  resolveExposed(callId, result, isError = false, tabId = "default") {
    return this.client.send("exposed.result", { callId, result, isError, tabId });
  }

  // Init scripts
  addInitScript(js, tabId = "default") {
    return this.client.send("addInitScript", { js, tabId });
  }

  // Events
  onExposedFunctionCalled(tabId, handler) {
    return this.client.onEvent("exposed_call", tabId, handler);
  }
}

export function createExportAPI(client) {
  return new ExportClient(client);
}