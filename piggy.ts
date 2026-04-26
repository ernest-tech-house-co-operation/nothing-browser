// piggy.ts
import { detectBinary, type BinaryMode } from "./piggy/launch/detect";
import { spawnBrowser, killBrowser, spawnBrowserOnSocket } from "./piggy/launch/spawn";
import { PiggyClient } from "./piggy/client";
import { setClient, setHumanMode, createSiteObject, type SiteObject } from "./piggy/register";
import { routeRegistry, keepAliveSites, startServer, stopServer } from "./piggy/server";
import { TabPool } from "./piggy/pool";
import logger from "./piggy/logger";

type TabMode = "tab" | "process";

let _client: PiggyClient | null = null;
let _tabMode: TabMode = "tab";
const _extraProcs: { socket: string; client: PiggyClient }[] = [];
const _sites: Record<string, SiteObject> = [];

const piggy: any = {
  // ── Local launch (socket) ─────────────────────────────────────────────────
  launch: async (opts?: { mode?: TabMode; binary?: BinaryMode }) => {
    _tabMode = opts?.mode ?? "tab";
    const binaryMode: BinaryMode = opts?.binary ?? "headless";
    await spawnBrowser(binaryMode);
    await new Promise(r => setTimeout(r, 500));
    _client = new PiggyClient();
    await _client.connect();
    setClient(_client);
    logger.info(`[piggy] launched — tab mode: "${_tabMode}", binary: "${binaryMode}"`);
    return piggy;
  },

  // ── Remote connect (HTTP) ─────────────────────────────────────────────────
  connect: async (opts: { host: string; key: string }) => {
    _tabMode = "tab";
    _client = new PiggyClient({ host: opts.host, key: opts.key });
    await _client.connect();
    setClient(_client);
    logger.info(`[piggy] connected (HTTP) → ${opts.host}`);
    return piggy;
  },

  // ── Register ──────────────────────────────────────────────────────────────
  register: async (
    name: string,
    url: string,
    opts?: {
      binary?: BinaryMode;
      pool?: number;
    }
  ) => {
    if (!url?.trim()) throw new Error(`No URL for site "${name}"`);
    const binaryMode: BinaryMode = opts?.binary ?? "headless";
    const poolSize = opts?.pool ?? 0;

    if (_tabMode === "tab") {
      if (!_client) throw new Error("No client. Call piggy.launch() or piggy.connect() first.");

      if (poolSize > 1) {
        const pool = new TabPool(_client, poolSize, url, name);
        await pool.init();
        const siteObj = createSiteObject(name, url, _client, "default", pool);
        _sites[name] = siteObj;
        piggy[name] = siteObj;
        logger.success(`[${name}] registered with pool of ${poolSize} tabs`);
      } else {
        const tabId = await _client.newTab();
        const siteObj = createSiteObject(name, url, _client, tabId);
        _sites[name] = siteObj;
        piggy[name] = siteObj;
        logger.success(`[${name}] registered as tab ${tabId}`);
      }
    } else {
      const socketName = `piggy_${name}`;
      await spawnBrowserOnSocket(socketName, binaryMode);
      await new Promise(r => setTimeout(r, 500));
      const c = new PiggyClient(socketName);
      await c.connect();
      _extraProcs.push({ socket: socketName, client: c });
      const siteObj = createSiteObject(name, url, c, "default");
      _sites[name] = siteObj;
      piggy[name] = siteObj;
      logger.success(`[${name}] registered as process on "${socketName}"`);
    }

    return piggy;
  },

  // ── Global controls ───────────────────────────────────────────────────────
  actHuman: (enable: boolean) => {
    setHumanMode(enable);
    logger.info(`[piggy] actHuman: ${enable}`);
    return piggy;
  },

  mode: (m: TabMode) => { _tabMode = m; return piggy; },

  // ── Expose Function ───────────────────────────────────────────────────────
  expose: async (name: string, handler: (data: any) => Promise<any> | any, tabId = "default") => {
    if (!_client) throw new Error("No client. Call piggy.launch() or piggy.connect() first.");
    await _client.exposeFunction(name, handler, tabId);
    logger.success(`[piggy] exposed global function: ${name}`);
    return piggy;
  },

  unexpose: async (name: string, tabId = "default") => {
    if (!_client) throw new Error("No client. Call piggy.launch() or piggy.connect() first.");
    await _client.unexposeFunction(name, tabId);
    logger.info(`[piggy] unexposed function: ${name}`);
    return piggy;
  },

  // ── Proxy ─────────────────────────────────────────────────────────────────
  proxy: {
    load:     (path: string)                                               => { if (!_client) throw new Error("No client"); return _client.proxyLoad(path); },
    fetch:    (url: string)                                                => { if (!_client) throw new Error("No client"); return _client.proxyFetch(url); },
    ovpn:     (path: string)                                               => { if (!_client) throw new Error("No client"); return _client.proxyOvpn(path); },
    set:      (opts: Parameters<PiggyClient["proxySet"]>[0])               => { if (!_client) throw new Error("No client"); return _client.proxySet(opts); },
    test:     ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyTest(); },
    testStop: ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyTestStop(); },
    next:     ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyNext(); },
    disable:  ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyDisable(); },
    enable:   ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyEnable(); },
    current:  ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyCurrent(); },
    stats:    ()                                                           => { if (!_client) throw new Error("No client"); return _client.proxyStats(); },
    list:     (limit?: number)                                             => { if (!_client) throw new Error("No client"); return _client.proxyList(limit); },
    rotation: (mode: "none" | "timed" | "perrequest", interval?: number)  => { if (!_client) throw new Error("No client"); return _client.proxyRotation(mode, interval); },
    config:   (opts: { skipDead?: boolean; autoCheck?: boolean })          => { if (!_client) throw new Error("No client"); return _client.proxyConfig(opts); },
    save:     (path: string, filter?: "alive" | "dead" | "all")           => { if (!_client) throw new Error("No client"); return _client.proxySave(path, filter); },
    on:       (event: string, handler: (data: any) => void)               => { if (!_client) throw new Error("No client"); return _client.onProxyEvent(event, handler); },
  },

  // ── Elysia server ─────────────────────────────────────────────────────────
  serve: (
    port: number,
    opts?: {
      hostname?: string;
      title?: string;
      version?: string;
      description?: string;
      path?: string;
    }
  ) => startServer(port, opts?.hostname, opts),

  stopServer,

  // ── Route listing ─────────────────────────────────────────────────────────
  routes: () =>
    Array.from(routeRegistry.entries()).map(([key, cfg]) => {
      const [site] = key.split(":");
      return {
        site,
        method: cfg.method,
        path: `/${site}${cfg.path}`,
        ttl: cfg.ttl,
        middlewareCount: cfg.before.length,
      };
    }),

  // ── Multi-site ────────────────────────────────────────────────────────────
  all: (sites: SiteObject[]) =>
    new Proxy({} as any, {
      get: (_, method: string) =>
        (...args: any[]) => Promise.all(sites.map((s: any) => s[method]?.(...args))),
    }),

  diff: (sites: SiteObject[]) =>
    new Proxy({} as any, {
      get: (_, method: string) =>
        async (...args: any[]) => {
          const results = await Promise.all(sites.map((s: any) => s[method]?.(...args)));
          return Object.fromEntries(sites.map((s: any, i) => [s._name ?? i, results[i]]));
        },
    }),

  // ── Shutdown ──────────────────────────────────────────────────────────────
  close: async (opts?: { force?: boolean }) => {
    stopServer();
    if (opts?.force) {
      for (const { client: c } of _extraProcs) c.disconnect();
      _client?.disconnect();
      killBrowser();
      routeRegistry.clear();
      keepAliveSites.clear();
    } else {
      for (const [name, site] of Object.entries(_sites)) {
        if (!keepAliveSites.has(name)) await (site as any).close?.();
      }
      if (keepAliveSites.size === 0) {
        for (const { client: c } of _extraProcs) c.disconnect();
        _extraProcs.length = 0;
        _client?.disconnect();
        _client = null;
        setClient(null);
        killBrowser();
      }
    }
    logger.info("[piggy] closed");
  },

  detect: detectBinary,
  logger,
};

// ── usePiggy ──────────────────────────────────────────────────────────────────
// Typed accessor — call AFTER register() so sites exist on piggy.
// const { amazon, ebay } = usePiggy<"amazon" | "ebay">()

type TypedPiggy<Sites extends string> = typeof piggy & {
  [K in Sites]: SiteObject;
};

export function usePiggy<Sites extends string>(): TypedPiggy<Sites> {
  return piggy as TypedPiggy<Sites>;
}

export type { SiteObject };
export default piggy;
export { piggy };