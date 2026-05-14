import { PiggyClient } from "../client";
import type { CookieSetOptions, CookieDeleteOptions } from "../export";
export interface SessionPaths {
    workDir: string;
    cookies: string;
    profile: string;
    ws: string;
    pings: string;
}
export declare class SessionClient {
    private client;
    constructor(client: PiggyClient);
    reload(tabId?: string): Promise<void>;
    paths(): Promise<SessionPaths>;
    cookiesPath(): Promise<string>;
    profilePath(): Promise<string>;
    wsPath(): Promise<string>;
    pingsPath(): Promise<string>;
    setWsSave(enabled: boolean): Promise<void>;
    setPingsSave(enabled: boolean): Promise<void>;
    export(tabId?: string): Promise<any>;
    import(data: any, tabId?: string): Promise<void>;
    setCookie(opts: CookieSetOptions, tabId?: string): Promise<void>;
    deleteCookie(opts: CookieDeleteOptions, tabId?: string): Promise<void>;
}
export declare function createSessionAPI(client: PiggyClient): SessionClient;
//# sourceMappingURL=index.d.ts.map