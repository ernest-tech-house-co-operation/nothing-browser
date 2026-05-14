// piggy/export/index.ts
import { PiggyClient } from "../client";
import type { CapturedRequest, WebSocketFrame, CapturedCookie } from "../capture";
import type { SessionPaths } from "../session";

// ─── Intercept ────────────────────────────────────────────────────────────────
export interface InterceptRule {
  pattern: string;
  block?: boolean;
  redirect?: string;
  setHeaders?: Record<string, string>;
  removeHeaders?: string[];
}

// ─── Cookie types (defined here, imported by session) ────────────────────────
export interface CookieSetOptions {
  name: string;
  value: string;
  domain: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  expiry?: number;
}

export interface CookieDeleteOptions {
  name: string;
  domain: string;
}

// ─── Session export types (re-exported from capture) ────────────────────────
export type { CapturedRequest, WebSocketFrame, CapturedCookie, SessionPaths };

export interface SessionExport {
  url: string;
  requests: CapturedRequest[];
  ws: WebSocketFrame[];
  cookies: CapturedCookie[];
}

export interface ExposedFunctionCall {
  name: string;
  callId: string;
  data: string;
  tabId: string;
}

// ─── ExportClient ─────────────────────────────────────────────────────────────
export class ExportClient {
  constructor(private client: PiggyClient) {}

  // DOM fetch
  searchCss(query: string, tabId = "default"): Promise<any> {
    return this.client.send("search.css", { query, tabId });
  }

  searchId(query: string, tabId = "default"): Promise<any> {
    return this.client.send("search.id", { query, tabId });
  }

  // Cookies
  setCookie(opts: CookieSetOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.set", { ...opts, tabId });
  }

  deleteCookie(opts: CookieDeleteOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.delete", { ...opts, tabId });
  }

  // Session
  sessionReload(tabId = "default"): Promise<void> {
    return this.client.send("session.reload", { tabId });
  }

  cookiesPath(): Promise<string> {
    return this.client.send("session.cookies.path", {});
  }

  profilePath(): Promise<string> {
    return this.client.send("session.profile.path", {});
  }

  wsPath(): Promise<string> {
    return this.client.send("session.ws.path", {});
  }

  pingsPath(): Promise<string> {
    return this.client.send("session.pings.path", {});
  }

  sessionPaths(): Promise<SessionPaths> {
    return this.client.send("session.paths", {});
  }

  setWsSave(enabled: boolean): Promise<void> {
    return this.client.send("session.ws.save", { enabled });
  }

  setPingsSave(enabled: boolean): Promise<void> {
    return this.client.send("session.pings.save", { enabled });
  }

  // Intercept rules
  addInterceptRule(rule: InterceptRule, tabId = "default"): Promise<void> {
    return this.client.send("intercept.rule.add", { ...rule, tabId });
  }

  clearInterceptRules(tabId = "default"): Promise<void> {
    return this.client.send("intercept.rule.clear", { tabId });
  }

  // Session export / import
  async exportSession(tabId = "default"): Promise<SessionExport> {
    const raw = await this.client.send<string>("session.export", { tabId });
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  importSession(data: SessionExport, tabId = "default"): Promise<void> {
    return this.client.send("session.import", {
      data: JSON.stringify(data),
      tabId,
    });
  }

  // Exposed functions
  exposeFunction(name: string, tabId = "default"): Promise<void> {
    return this.client.send("expose.function", { name, tabId });
  }

  resolveExposed(callId: string, result: string, isError = false, tabId = "default"): Promise<void> {
    return this.client.send("exposed.result", { callId, result, isError, tabId });
  }

  // Init scripts
  addInitScript(js: string, tabId = "default"): Promise<void> {
    return this.client.send("addInitScript", { js, tabId });
  }

  // Events
  onExposedFunctionCalled(tabId: string, handler: (call: ExposedFunctionCall) => void): () => void {
    return this.client.onEvent("exposed_call", tabId, handler);
  }
}

export function createExportAPI(client: PiggyClient): ExportClient {
  return new ExportClient(client);
}