import { PiggyClient } from "../client";
export interface CaptchaState {
    detected: boolean;
    paused: boolean;
    type: string;
}
export interface BlockState {
    detected: boolean;
    type: string;
}
export declare class CaptchaClient {
    private client;
    constructor(client: PiggyClient);
    status(tabId?: string): Promise<CaptchaState>;
    resolve(tabId?: string): Promise<void>;
    pause(tabId?: string): Promise<void>;
    check(tabId?: string): Promise<void>;
    setAutoRetry(enabled: boolean): Promise<void>;
    blockStatus(tabId?: string): Promise<BlockState>;
    blockRetry(tabId?: string): Promise<void>;
    onCaptcha(tabId: string, handler: (data: {
        captchaType: string;
        tabId: string;
    }) => void): () => void;
    onCaptchaResolved(tabId: string, handler: (data: {
        tabId: string;
    }) => void): () => void;
    onBlocked(tabId: string, handler: (data: {
        blockType: string;
        tabId: string;
    }) => void): () => void;
    onBlockRetry(tabId: string, handler: (data: {
        tabId: string;
        proxy: string;
    }) => void): () => void;
    waitForResolution(tabId?: string, timeoutMs?: number): Promise<void>;
}
export declare function createCaptchaAPI(client: PiggyClient): CaptchaClient;
//# sourceMappingURL=index.d.ts.map