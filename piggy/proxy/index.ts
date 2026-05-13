// piggy/proxy/index.ts
import { PiggyClient } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProxyType    = "http" | "https" | "socks5";
export type ProxyHealth  = "alive" | "dead" | "checking" | "unchecked";
export type RotationMode = "none" | "timed" | "perrequest";

export interface ProxyEntry {
  index:   number;
  host:    string;
  port:    number;
  type:    ProxyType;
  user:    string;
  proxy:   string;   // full string e.g. "socks5://user:pass@host:port"
  latency: number;
  health:  ProxyHealth;
  current: boolean;
}

export interface ProxyStats {
  total:     number;
  alive:     number;
  dead:      number;
  index:     number;
  active:    boolean;
  checking:  boolean;
  skipDead:  boolean;
  autoCheck: boolean;
}

export interface ProxyListResult {
  proxies: ProxyEntry[];
  total:   number;
  shown:   number;
}

export interface ProxyCurrent {
  active:  boolean;
  host?:   string;
  port?:   number;
  type?:   ProxyType;
  user?:   string;
  proxy?:  string;
  latency?: number;
  health?: ProxyHealth;
}

export interface ProxyConfig {
  skipDead:  boolean;
  autoCheck: boolean;
}

// ─── Inline set options ───────────────────────────────────────────────────────

export type ProxySetOptions =
  | { proxy: string }
  | { host: string; port: number; type?: ProxyType; user?: string; pass?: string };

// ─── ProxyClient ──────────────────────────────────────────────────────────────

export class ProxyClient {
  constructor(private client: PiggyClient) {}

  /** Load proxies from a local file path. */
  load(path: string): Promise<void> {
    return this.client.send("proxy.load", { path });
  }

  /** Fetch proxies from a URL. Result comes via proxy:loaded / proxy:fetch:failed events. */
  fetch(url: string): Promise<void> {
    return this.client.send("proxy.fetch", { url });
  }

  /** Load an .ovpn config file. */
  ovpn(path: string): Promise<void> {
    return this.client.send("proxy.ovpn", { path });
  }

  /** Set a single proxy inline. */
  set(opts: ProxySetOptions): Promise<void> {
    return this.client.send("proxy.set", opts);
  }

  /** Health-check all loaded proxies. Results come via events. */
  test(): Promise<void> {
    return this.client.send("proxy.test", {});
  }

  /** Abort an in-progress health check. */
  testStop(): Promise<void> {
    return this.client.send("proxy.test.stop", {});
  }

  /** Rotate to the next proxy in the pool. */
  next(): Promise<string> {
    return this.client.send("proxy.next", {});
  }

  /** Alias for next(). */
  rotate(): Promise<string> {
    return this.client.send("proxy.rotate", {});
  }

  /** Disable the proxy — use the real IP. */
  disable(): Promise<void> {
    return this.client.send("proxy.disable", {});
  }

  /** Re-enable the current proxy. */
  enable(): Promise<void> {
    return this.client.send("proxy.enable", {});
  }

  /** Get the current active proxy details. */
  current(): Promise<ProxyCurrent> {
    return this.client.send("proxy.current", {});
  }

  /** Get pool stats: total, alive, dead, index, active, checking. */
  stats(): Promise<ProxyStats> {
    return this.client.send("proxy.stats", {});
  }

  /** List all proxies with health info. limit defaults to 500. */
  list(limit?: number): Promise<ProxyListResult> {
    return this.client.send("proxy.list", { limit });
  }

  /** Set rotation mode and interval (seconds, only used for "timed"). */
  rotation(mode: RotationMode, interval?: number): Promise<void> {
    return this.client.send("proxy.rotation", { mode, interval });
  }

  /** Set skipDead / autoCheck flags. */
  config(opts: Partial<ProxyConfig>): Promise<ProxyConfig> {
    return this.client.send("proxy.config", opts);
  }

  /**
   * Save the current proxy list to a file.
   * filter: "all" | "alive" | "dead" — defaults to "all".
   */
  save(path: string, filter?: "all" | "alive" | "dead"): Promise<void> {
    return this.client.send("proxy.save", { path, filter });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createProxyAPI(client: PiggyClient): ProxyClient {
  return new ProxyClient(client);
}