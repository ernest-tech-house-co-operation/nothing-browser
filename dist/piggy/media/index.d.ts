import { PiggyClient } from "../client";
export declare class MediaClient {
    private client;
    constructor(client: PiggyClient);
    screenshot(filePath?: string, tabId?: string): Promise<string>;
    pdf(filePath?: string, tabId?: string): Promise<string>;
    blockImages(tabId?: string): Promise<void>;
    unblockImages(tabId?: string): Promise<void>;
}
export declare function createMediaAPI(client: PiggyClient): MediaClient;
//# sourceMappingURL=index.d.ts.map