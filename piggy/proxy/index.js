// piggy/proxy/index.js
import { PiggyClient } from "../client/index.js";

export class ProxyClient {
  constructor(client) {
    this.client = client;
  }

  /** Load proxies from a local file path. */
  load(path) {
    return this.client.send("proxy.load", { path });
  }

  /** Fetch proxies from a URL. Result comes via proxy:loaded / proxy:fetch:failed events. */
  fetch(url) {
    return this.client.send("proxy.fetch", { url });
  }

  /** Load an .ovpn config file. */
  ovpn(path) {
    return this.client.send("proxy.ovpn", { path });
  }

  /** Set a single proxy inline. */
  set(opts) {
    return this.client.send("proxy.set", opts);
  }

  /** Health-check all loaded proxies. Results come via events. */
  test() {
    return this.client.send("proxy.test", {});
  }

  /** Abort an in-progress health check. */
  testStop() {
    return this.client.send("proxy.test.stop", {});
  }

  /** Rotate to the next proxy in the pool. */
  next() {
    return this.client.send("proxy.next", {});
  }

  /** Alias for next(). */
  rotate() {
    return this.client.send("proxy.rotate", {});
  }

  /** Disable the proxy — use the real IP. */
  disable() {
    return this.client.send("proxy.disable", {});
  }

  /** Re-enable the current proxy. */
  enable() {
    return this.client.send("proxy.enable", {});
  }

  /** Get the current active proxy details. */
  current() {
    return this.client.send("proxy.current", {});
  }

  /** Get pool stats: total, alive, dead, index, active, checking. */
  stats() {
    return this.client.send("proxy.stats", {});
  }

  /** List all proxies with health info. limit defaults to 500. */
  list(limit) {
    return this.client.send("proxy.list", { limit });
  }

  /** Set rotation mode and interval (seconds, only used for "timed"). */
  rotation(mode, interval) {
    return this.client.send("proxy.rotation", { mode, interval });
  }

  /** Set skipDead / autoCheck flags. */
  config(opts) {
    return this.client.send("proxy.config", opts);
  }

  /**
   * Save the current proxy list to a file.
   * filter: "all" | "alive" | "dead" — defaults to "all".
   */
  save(path, filter) {
    return this.client.send("proxy.save", { path, filter });
  }
}

export function createProxyAPI(client) {
  return new ProxyClient(client);
}