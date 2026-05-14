import { PiggyClient } from "../client";
export declare class NavigationClient {
    private client;
    constructor(client: PiggyClient);
    navigate(url: string, tabId?: string): Promise<void>;
    reload(tabId?: string): Promise<void>;
    goBack(tabId?: string): Promise<void>;
    goForward(tabId?: string): Promise<void>;
    url(tabId?: string): Promise<string>;
    title(tabId?: string): Promise<string>;
    content(tabId?: string): Promise<string>;
    waitForNavigation(tabId?: string): Promise<void>;
    waitForSelector(selector: string, timeout?: number, tabId?: string): Promise<void>;
}
export declare function createNavigationAPI(client: PiggyClient): NavigationClient;
//# sourceMappingURL=index.d.ts.map