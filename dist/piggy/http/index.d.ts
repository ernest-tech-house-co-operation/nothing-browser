export interface HttpClientOptions {
    host?: string;
    port?: number;
    key: string;
}
export declare class PiggyHttpClient {
    private baseUrl;
    private key;
    constructor(opts: HttpClientOptions);
    ping(): Promise<boolean>;
    send<T = any>(cmd: string, payload?: Record<string, any>): Promise<T>;
}
export declare function createHttpClient(opts: HttpClientOptions): PiggyHttpClient;
//# sourceMappingURL=index.d.ts.map