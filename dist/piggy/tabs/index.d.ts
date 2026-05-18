import { PiggyClient } from "../client";
export declare class TabsClient {
    private client;
    constructor(client: PiggyClient);
    new(): Promise<string>;
    close(opts: string | {
        tabId: string;
    }): Promise<void>;
    list(): Promise<string[]>;
}
export declare function createTabsAPI(client: PiggyClient): TabsClient;
//# sourceMappingURL=index.d.ts.map