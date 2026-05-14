import { PiggyClient } from "../client";
import type { CapturedRequest, WebSocketFrame, CapturedCookie } from "../capture";
import type { SessionPaths } from "../session";
export interface InterceptRule {
    pattern: string;
    block?: boolean;
    redirect?: string;
    setHeaders?: Record<string, string>;
    removeHeaders?: string[];
}
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
export declare class ExportClient {
    private client;
    constructor(client: PiggyClient);
    searchCss(query: string, tabId?: string): Promise<any>;
    searchId(query: string, tabId?: string): Promise<any>;
    setCookie(opts: CookieSetOptions, tabId?: string): Promise<void>;
    deleteCookie(opts: CookieDeleteOptions, tabId?: string): Promise<void>;
    sessionReload(tabId?: string): Promise<void>;
    cookiesPath(): Promise<string>;
    profilePath(): Promise<string>;
    wsPath(): Promise<string>;
    pingsPath(): Promise<string>;
    sessionPaths(): Promise<SessionPaths>;
    setWsSave(enabled: boolean): Promise<void>;
    setPingsSave(enabled: boolean): Promise<void>;
    addInterceptRule(rule: InterceptRule, tabId?: string): Promise<void>;
    clearInterceptRules(tabId?: string): Promise<void>;
    exportSession(tabId?: string): Promise<SessionExport>;
    importSession(data: SessionExport, tabId?: string): Promise<void>;
    exposeFunction(name: string, tabId?: string): Promise<void>;
    resolveExposed(callId: string, result: string, isError?: boolean, tabId?: string): Promise<void>;
    addInitScript(js: string, tabId?: string): Promise<void>;
    onExposedFunctionCalled(tabId: string, handler: (call: ExposedFunctionCall) => void): () => void;
}
export declare function createExportAPI(client: PiggyClient): ExportClient;
//# sourceMappingURL=index.d.ts.map