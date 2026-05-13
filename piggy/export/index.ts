// piggy/export/index.ts
import { PiggyClient } from "../client";

// ─── Cookie ───────────────────────────────────────────────────────────────────

export interface CookieSetOptions {
  name: string;
  value: string;
  domain: string;
  /** @default "/" */
  path?: string;
  /** @default false */
  httpOnly?: boolean;
  /** @default false */
  secure?: boolean;
  /** Unix epoch seconds. Omit for a session cookie. */
  expiry?: number;
}

export interface CookieDeleteOptions {
  name: string;
  domain: string;
}

// ─── Network capture ──────────────────────────────────────────────────────────

export interface CapturedRequest {
  method: string;
  url: string;
  status: string;
  type: string;
  mime: string;
  reqHeaders: string;
  reqBody: string;
  resHeaders: string;
  resBody: string;
}

export interface WebSocketFrame {
  url: string;
  direction: string;
  data: string;
  binary: boolean;
}

export interface CapturedCookie {
  name: string;
  value: string;
  domain: string;
}

export interface SessionExport {
  url: string;
  requests: CapturedRequest[];
  ws: WebSocketFrame[];
  cookies: CapturedCookie[];
}

// ─── Session paths ────────────────────────────────────────────────────────────

export interface SessionPaths {
  workDir: string;
  cookies: string;
  profile: string;
  ws: string;
  pings: string;
}

// ─── Intercept ────────────────────────────────────────────────────────────────

export interface InterceptRule {
  pattern: string;
  block?: boolean;
  redirect?: string;
  setHeaders?: Record<string, string>;
  removeHeaders?: string[];
}

// ─── ExposedFunction event ────────────────────────────────────────────────────

export interface ExposedFunctionCall {
  name: string;
  callId: string;
  data: string;
  tabId: string;
}

// ─── ExportClient ─────────────────────────────────────────────────────────────

export class ExportClient {
  constructor(private client: PiggyClient) {}

  // ── Cookies ─────────────────────────────────────────────────────────────────

  setCookie(opts: CookieSetOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.set", { ...opts, tabId });
  }

  deleteCookie(opts: CookieDeleteOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.delete", { ...opts, tabId });
  }

  // ── Session ─────────────────────────────────────────────────────────────────

  /** Reload cookies/session from disk. */
  sessionReload(tabId = "default"): Promise<void> {
    return this.client.send("session.reload", { tabId });
  }

  /** Get path of the cookies file. */
  cookiesPath(tabId = "default"): Promise<string> {
    return this.client.send("session.cookies.path", { tabId });
  }

  /** Get path of the browser profile directory. */
  profilePath(tabId = "default"): Promise<string> {
    return this.client.send("session.profile.path", { tabId });
  }

  /** Get path of ws.json. */
  wsPath(tabId = "default"): Promise<string> {
    return this.client.send("session.ws.path", { tabId });
  }

  /** Get path of pings.json. */
  pingsPath(tabId = "default"): Promise<string> {
    return this.client.send("session.pings.path", { tabId });
  }

  /** Get all data-file paths at once. */
  sessionPaths(tabId = "default"): Promise<SessionPaths> {
    return this.client.send("session.paths", { tabId });
  }

  /** Enable / disable WebSocket frame persistence to ws.json. */
  setWsSave(enabled: boolean, tabId = "default"): Promise<void> {
    return this.client.send("session.ws.save", { enabled, tabId });
  }

  /** Enable / disable ping persistence to pings.json. */
  setPingsSave(enabled: boolean, tabId = "default"): Promise<void> {
    return this.client.send("session.pings.save", { enabled, tabId });
  }

  // ── Intercept rules ─────────────────────────────────────────────────────────

  addInterceptRule(rule: InterceptRule, tabId = "default"): Promise<void> {
    return this.client.send("intercept.rule.add", { ...rule, tabId });
  }

  clearInterceptRules(tabId = "default"): Promise<void> {
    return this.client.send("intercept.rule.clear", { tabId });
  }

  // ── Session export / import ─────────────────────────────────────────────────

  /** Export captured requests, WS frames, and cookies as a structured object. */
  exportSession(tabId = "default"): Promise<SessionExport> {
    return this.client.send("session.export", { tabId }).then((raw) =>
      typeof raw === "string" ? JSON.parse(raw) : raw
    );
  }

  /** Import a previously exported session blob back into the tab context. */
  importSession(data: SessionExport, tabId = "default"): Promise<void> {
    return this.client.send("session.import", {
      data: JSON.stringify(data),
      tabId,
    });
  }

  // ── Exposed functions ───────────────────────────────────────────────────────

  /**
   * Register a JS function name so the page can call it and have the result
   * routed back to the host script via the `exposedFunction` event.
   */
  exposeFunction(name: string, tabId = "default"): Promise<void> {
    return this.client.send("expose.function", { name, tabId });
  }

  /**
   * Resolve (or reject) a pending page-side call created by an exposed function.
   */
  resolveExposed(
    callId: string,
    result: string,
    isError = false,
    tabId = "default"
  ): Promise<void> {
    return this.client.send("exposed.result", { callId, result, isError, tabId });
  }

  // ── Init scripts ────────────────────────────────────────────────────────────

  /**
   * Inject a JS snippet that runs at DocumentCreation on every page load
   * for this tab (persisted across navigations via QWebEngineScript).
   */
  addInitScript(js: string, tabId = "default"): Promise<void> {
    return this.client.send("addInitScript", { js, tabId });
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  /**
   * Subscribe to calls made by a page-exposed function.
   * Returns an unsubscribe function.
   */
  onExposedFunctionCalled(
    tabId: string,
    handler: (call: ExposedFunctionCall) => void
  ): () => void {
    return this.client.onEvent("exposedFunction", tabId, handler);
  }
}

// ── Factory helper ────────────────────────────────────────────────────────────

export function createExportAPI(client: PiggyClient): ExportClient {
  return new ExportClient(client);
}