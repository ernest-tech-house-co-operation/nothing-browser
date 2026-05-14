import { PiggyClient } from "../client";
export type WaitSelectorState = "attached" | "detached" | "visible" | "hidden";
export declare class WaitClient {
    private client;
    constructor(client: PiggyClient);
    function(js: string, timeout?: number, tabId?: string): Promise<void>;
    selector(selector: string, state?: WaitSelectorState, timeout?: number, tabId?: string): Promise<void>;
}
export declare class EvaluateClient {
    private client;
    constructor(client: PiggyClient);
    run(js: string, timeout?: number, tabId?: string): Promise<unknown>;
}
export declare class FetchClient {
    private client;
    constructor(client: PiggyClient);
    text(selector: string, tabId?: string): Promise<string | null>;
    textAll(selector: string, tabId?: string): Promise<string[]>;
    attr(selector: string, attr: string, tabId?: string): Promise<string | null>;
    attrAll(selector: string, attr: string, tabId?: string): Promise<string[]>;
    links(selector: string, tabId?: string): Promise<string[]>;
    linksAll(tabId?: string): Promise<string[]>;
    images(selector: string, tabId?: string): Promise<string[]>;
}
export declare function createWaitAPI(client: PiggyClient): WaitClient;
export declare function createEvaluateAPI(client: PiggyClient): EvaluateClient;
export declare function createFetchAPI(client: PiggyClient): FetchClient;
//# sourceMappingURL=index.d.ts.map