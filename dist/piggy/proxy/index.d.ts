import { PiggyClient } from "../client";
export type ProxyType = "http" | "https" | "socks5";
export type ProxyHealth = "alive" | "dead" | "checking" | "unchecked";
export type RotationMode = "none" | "timed" | "perrequest";
export interface ProxyEntry {
    index: number;
    host: string;
    port: number;
    type: ProxyType;
    user: string;
    proxy: string;
    latency: number;
    health: ProxyHealth;
    current: boolean;
}
export interface ProxyStats {
    total: number;
    alive: number;
    dead: number;
    index: number;
    active: boolean;
    checking: boolean;
    skipDead: boolean;
    autoCheck: boolean;
}
export interface ProxyListResult {
    proxies: ProxyEntry[];
    total: number;
    shown: number;
}
export interface ProxyCurrent {
    active: boolean;
    host?: string;
    port?: number;
    type?: ProxyType;
    user?: string;
    proxy?: string;
    latency?: number;
    health?: ProxyHealth;
}
export interface ProxyConfig {
    skipDead: boolean;
    autoCheck: boolean;
}
export type ProxySetOptions = {
    proxy: string;
} | {
    host: string;
    port: number;
    type?: ProxyType;
    user?: string;
    pass?: string;
};
export declare class ProxyClient {
    private client;
    constructor(client: PiggyClient);
    /** Load proxies from a local file path. */
    load(path: string): Promise<void>;
    /** Fetch proxies from a URL. Result comes via proxy:loaded / proxy:fetch:failed events. */
    fetch(url: string): Promise<void>;
    /** Load an .ovpn config file. */
    ovpn(path: string): Promise<void>;
    /** Set a single proxy inline. */
    set(opts: ProxySetOptions): Promise<void>;
    /** Health-check all loaded proxies. Results come via events. */
    test(): Promise<void>;
    /** Abort an in-progress health check. */
    testStop(): Promise<void>;
    /** Rotate to the next proxy in the pool. */
    next(): Promise<string>;
    /** Alias for next(). */
    rotate(): Promise<string>;
    /** Disable the proxy — use the real IP. */
    disable(): Promise<void>;
    /** Re-enable the current proxy. */
    enable(): Promise<void>;
    /** Get the current active proxy details. */
    current(): Promise<ProxyCurrent>;
    /** Get pool stats: total, alive, dead, index, active, checking. */
    stats(): Promise<ProxyStats>;
    /** List all proxies with health info. limit defaults to 500. */
    list(limit?: number): Promise<ProxyListResult>;
    /** Set rotation mode and interval (seconds, only used for "timed"). */
    rotation(mode: RotationMode, interval?: number): Promise<void>;
    /** Set skipDead / autoCheck flags. */
    config(opts: Partial<ProxyConfig>): Promise<ProxyConfig>;
    /**
     * Save the current proxy list to a file.
     * filter: "all" | "alive" | "dead" — defaults to "all".
     */
    save(path: string, filter?: "all" | "alive" | "dead"): Promise<void>;
}
export declare function createProxyAPI(client: PiggyClient): ProxyClient;
//# sourceMappingURL=index.d.ts.map