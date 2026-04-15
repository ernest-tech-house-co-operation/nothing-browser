// piggy.ts
import { detectBinary, type BinaryMode } from "./piggy/launch/detect";
import { spawnBrowser, killBrowser, spawnBrowserOnSocket } from "./piggy/launch/spawn";
import { PiggyClient } from "./piggy/client";
import { setClient, setHumanMode, createSiteObject } from "./piggy/register";
import { routeRegistry, keepAliveSites, startServer, stopServer } from "./piggy/server";
import logger from "./piggy/logger";

type TabMode = "tab" | "process";
type SiteObject = ReturnType<typeof createSiteObject>;

let _client: PiggyClient | null = null;
let _tabMode: TabMode = "tab";
const _extraProcs: { socket: string; client: PiggyClient }[] = [];
const _sites: Record<string, SiteObject> = {};

// CREATE THE PIGGY OBJECT AS A PLAIN OBJECT - NOT A PROXY
const piggy: any = {
  // ── Lifecycle ───────────────────────────────────────────────────────────────

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

  register: async (name: string, url: string, opts?: { binary?: BinaryMode }) => {
    if (!url?.trim()) throw new Error(`No URL for site "${name}"`);
    const binaryMode: BinaryMode = opts?.binary ?? "headless";

    let tabId = "default";
    if (_tabMode === "tab") {
      if (!_client) throw new Error("No client. Call piggy.launch() first.");
      tabId = await _client.newTab();
      // HERE IT IS - CREATE SITE OBJECT AND ASSIGN DIRECTLY
      const siteObj = createSiteObject(name, url, _client, tabId);
      _sites[name] = siteObj;
      piggy[name] = siteObj;  // DIRECT ASSIGNMENT - NO PROXY
      logger.success(`[${name}] registered as tab ${tabId}`);
    } else {
      const socketName = `piggy_${name}`;
      await spawnBrowserOnSocket(socketName, binaryMode);
      await new Promise(r => setTimeout(r, 500));
      const c = new PiggyClient(socketName);
      await c.connect();
      _extraProcs.push({ socket: socketName, client: c });
      const siteObj = createSiteObject(name, url, c, "default");
      _sites[name] = siteObj;
      piggy[name] = siteObj;  // DIRECT ASSIGNMENT - NO PROXY
      logger.success(`[${name}] registered as process on "${socketName}"`);
    }

    return piggy;
  },

  // ── Global controls ─────────────────────────────────────────────────────────

  actHuman: (enable: boolean) => {
    setHumanMode(enable);
    logger.info(`[piggy] actHuman: ${enable}`);
    return piggy;
  },

  mode: (m: TabMode) => { _tabMode = m; return piggy; },

  // ── Expose Function (global) ─────────────────────────────────────────────────

  expose: async (name: string, handler: (data: any) => Promise<any> | any, tabId = "default") => {
    if (!_client) throw new Error("No client. Call piggy.launch() first.");
    await _client.exposeFunction(name, handler, tabId);
    logger.success(`[piggy] exposed global function: ${name}`);
    return piggy;
  },

  unexpose: async (name: string, tabId = "default") => {
    if (!_client) throw new Error("No client. Call piggy.launch() first.");
    await _client.unexposeFunction(name, tabId);
    logger.info(`[piggy] unexposed function: ${name}`);
    return piggy;
  },

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

// NO PROXY WRAPPER - EXPORT THE PLAIN OBJECT DIRECTLY
export default piggy;
export { piggy };