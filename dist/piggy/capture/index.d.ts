import { PiggyClient } from "../client";
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
    size: number;
    timestamp: string;
}
export interface WebSocketFrame {
    connectionId: string;
    url: string;
    direction: string;
    data: string;
    binary: boolean;
    timestamp: string;
}
export interface CapturedCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    expires: string;
}
export interface StorageEntry {
    key: string;
    value: string;
}
export declare class CaptureClient {
    private client;
    constructor(client: PiggyClient);
    start(tabId?: string): Promise<void>;
    stop(tabId?: string): Promise<void>;
    requests(tabId?: string): Promise<CapturedRequest[]>;
    ws(tabId?: string): Promise<WebSocketFrame[]>;
    cookies(tabId?: string): Promise<CapturedCookie[]>;
    storage(tabId?: string): Promise<StorageEntry[]>;
    clear(tabId?: string): Promise<void>;
}
export declare function createCaptureAPI(client: PiggyClient): CaptureClient;
//# sourceMappingURL=index.d.ts.map