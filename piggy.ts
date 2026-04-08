// piggy.ts
import { detectBinary } from "./piggy/launch/detect";
import { spawnBrowser, killBrowser, spawnBrowserOnSocket } from "./piggy/launch/spawn";
import { PiggyClient } from "./piggy/client";
import { setClient, setHumanMode, createSiteObject } from "./piggy/register";
import { routeRegistry, keepAliveSites, startServer, stopServer } from "./piggy/server";
import logger from "./piggy/logger";

type BrowserMode = "tab" | "process";
type SiteObject = ReturnType<typeof createSiteObject>;

let _client: PiggyClient | null = null;
let _mode: BrowserMode = "tab";
const _extraProcs: { socket: string; client: PiggyClient }[] = [];
const _sites: Record<string, SiteObject> = {};

const piggy: any = {
  // ── Lifecycle ───────────────────────────────────────────────────────────────

  launch: async (opts?: { mode?: BrowserMode }) => {
    _mode = opts?.mode ?? "tab";
    await spawnBrowser();
    await new Promise(r => setTimeout(r, 500));
    _client = new PiggyClient();
    await _client.connect();
    setClient(_client);
    logger.info(`[piggy] launched in "${_mode}" mode`);
    return piggy;
  },

  register: async (name: string, url: string, opts?: any) => {
    if (!url?.trim()) throw new Error(`No URL for site "${name}"`);

    let tabId = "default";
    if (_mode === "tab") {
      tabId = await _client!.newTab();
      _sites[name] = createSiteObject(name, url, _client!, tabId);
      piggy[name] = _sites[name];
      logger.success(`[${name}] registered as tab ${tabId}`);
    } else {
      const socketName = `piggy_${name}`;
      await spawnBrowserOnSocket(socketName);
      await new Promise(r => setTimeout(r, 500));
      const c = new PiggyClient(socketName);
      await c.connect();
      _extraProcs.push({ socket: socketName, client: c });
      _sites[name] = createSiteObject(name, url, c, "default");
      piggy[name] = _sites[name];
      logger.success(`[${name}] registered as process on "${socketName}"`);
    }

    if (opts?.mode) logger.info(`[${name}] mode: ${opts.mode}`);
    return piggy;
  },

  // ── Global controls ─────────────────────────────────────────────────────────

  actHuman: (enable: boolean) => {
    setHumanMode(enable);
    logger.info(`[piggy] actHuman: ${enable}`);
    return piggy;
  },

  mode: (m: BrowserMode) => { _mode = m; return piggy; },

  // ── Elysia server ────────────────────────────────────────────────────────────

  serve: (port: number, opts?: { hostname?: string }) =>
    startServer(port, opts?.hostname),

  stopServer,

  // ── Route listing ────────────────────────────────────────────────────────────

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

  // ── Multi-site ───────────────────────────────────────────────────────────────

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

  // ── Shutdown ─────────────────────────────────────────────────────────────────

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
        if (!keepAliveSites.has(name)) await site.close?.();
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

export default piggy;
export { piggy };