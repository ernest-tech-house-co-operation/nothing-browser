import { PiggyClient } from "../client";
export declare class TabPool {
    private client;
    private size;
    private seedUrl;
    private name;
    private idle;
    private busy;
    private queue;
    constructor(client: PiggyClient, size: number, seedUrl: string, name: string);
    init(): Promise<void>;
    acquire(): Promise<string>;
    release(tabId: string): void;
    withTab<T>(fn: (tabId: string) => Promise<T>): Promise<T>;
    close(): Promise<void>;
    get stats(): {
        idle: number;
        busy: number;
        queued: number;
        total: number;
    };
}
//# sourceMappingURL=index.d.ts.map