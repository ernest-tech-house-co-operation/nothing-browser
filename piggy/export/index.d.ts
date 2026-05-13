// piggy/export/index.d.ts
import { PiggyClient } from "../client";

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

export interface SessionPaths {
  workDir: string;
  cookies: string;
  profile: string;
  ws: string;
  pings: string;
}

export interface InterceptRule {
  pattern: string;
  block?: boolean;
  redirect?: string;
  setHeaders?: Record<string, string>;
  removeHeaders?: string[];
}

export interface ExposedFunctionCall {
  name: string;
  callId: string;
  data: string;
  tabId: string;
}

export declare class ExportClient {
  constructor(client: PiggyClient);

  // Cookies
  setCookie(opts: CookieSetOptions, tabId?: string): Promise<void>;
  deleteCookie(opts: CookieDeleteOptions, tabId?: string): Promise<void>;

  // Session
  sessionReload(tabId?: string): Promise<void>;
  cookiesPath(tabId?: string): Promise<string>;
  profilePath(tabId?: string): Promise<string>;
  wsPath(tabId?: string): Promise<string>;
  pingsPath(tabId?: string): Promise<string>;
  sessionPaths(tabId?: string): Promise<SessionPaths>;
  setWsSave(enabled: boolean, tabId?: string): Promise<void>;
  setPingsSave(enabled: boolean, tabId?: string): Promise<void>;

  // Intercept rules
  addInterceptRule(rule: InterceptRule, tabId?: string): Promise<void>;
  clearInterceptRules(tabId?: string): Promise<void>;

  // Session export / import
  exportSession(tabId?: string): Promise<SessionExport>;
  importSession(data: SessionExport, tabId?: string): Promise<void>;

  // Exposed functions
  exposeFunction(name: string, tabId?: string): Promise<void>;
  resolveExposed(callId: string, result: string, isError?: boolean, tabId?: string): Promise<void>;

  // Init scripts
  addInitScript(js: string, tabId?: string): Promise<void>;

  // Events
  onExposedFunctionCalled(
    tabId: string,
    handler: (call: ExposedFunctionCall) => void
  ): () => void;
}

export declare function createExportAPI(client: PiggyClient): ExportClient;