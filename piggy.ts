// piggy.ts
//the main file
import { detectBinary, type BinaryMode } from "./piggy/launch/detect";
import { spawnBrowser, killBrowser, spawnBrowserOnSocket } from "./piggy/launch/spawn";
import { PiggyClient } from "./piggy/client";
import { setClient, setHumanMode, createSiteObject, type SiteObject } from "./piggy/register";
import { routeRegistry, keepAliveSites, startServer, stopServer } from "./piggy/server";
import { TabPool } from "./piggy/pool";
import { createRouter, type PiggyRouter } from "./piggy/router";
import { createCaptureAPI } from "./piggy/capture";
import { createCaptchaAPI } from "./piggy/captcha";
import { createDialogAPI } from "./piggy/dialog";
import { createExportAPI } from "./piggy/export";
import { createFindAPI } from "./piggy/find";
import { createHumanAPI } from "./piggy/human";
import { createIframeAPI } from "./piggy/iframe";
import { createInteractionsAPI } from "./piggy/interactions";
import { createMediaAPI } from "./piggy/media";
import { createNavigationAPI } from "./piggy/navigation";
import { createProvideAPI } from "./piggy/provide";
import { createProxyAPI } from "./piggy/proxy";
import { createSessionAPI } from "./piggy/session";
import { createTabsAPI } from "./piggy/tabs";
import { createWaitAPI, createEvaluateAPI, createFetchAPI } from "./piggy/wait";
import { createHttpClient, type HttpClientOptions } from "./piggy/http";
import logger from "./piggy/logger";

type TabMode = "tab" | "process";

let _client: PiggyClient | null = null;
let _router: PiggyRouter | null = null;
let _tabMode: TabMode = "tab";
const _extraProcs: { socket: string; client: PiggyClient }[] = [];
const _sites: Record<string, SiteObject> = {};

// ── Internal guard ────────────────────────────────────────────────────────────

function guardClient(): PiggyClient {
  if (!_client) throw new Error("No client. Call piggy.launch() or piggy.connect() first.");
  return _client;
}

// ── Build sub-APIs from a client ──────────────────────────────────────────────

function buildAPIs(client: PiggyClient) {
  _router = createRouter(client);
}

const piggy: any = {

  // ── Local launch (unix socket) ────────────────────────────────────────────
  launch: async (opts?: { mode?: TabMode; binary?: BinaryMode }) => {
    _tabMode = opts?.mode ?? "tab";
    const binaryMode: BinaryMode = opts?.binary ?? "headless";
    await spawnBrowser(binaryMode);
    await new Promise(r => setTimeout(r, 500));
    _client = new PiggyClient();
    await _client.connect();
    setClient(_client);
    buildAPIs(_client);
    logger.info(`[piggy] launched — tab mode: "${_tabMode}", binary: "${binaryMode}"`);
    return piggy;
  },

  // ── Remote connect (HTTP) ─────────────────────────────────────────────────
  connect: async (opts: { host: string; key: string }) => {
    _tabMode = "tab";
    _client = new PiggyClient({ host: opts.host, key: opts.key });
    await _client.connect();
    setClient(_client);
    buildAPIs(_client);
    logger.info(`[piggy] connected (HTTP) → ${opts.host}`);
    return piggy;
  },

  // ── HTTP client (port 2005 direct) ────────────────────────────────────────
  // Use when you want to talk to the browser over HTTP without a socket client.
  http: (opts: HttpClientOptions) => createHttpClient(opts),

  // ── Register ──────────────────────────────────────────────────────────────
  register: async (
    name: string,
    url: string,
    opts?: { binary?: BinaryMode; pool?: number }
  ) => {
    if (!url?.trim()) throw new Error(`No URL for site "${name}"`);
    const binaryMode: BinaryMode = opts?.binary ?? "headless";
    const poolSize = opts?.pool ?? 0;

    if (_tabMode === "tab") {
      const client = guardClient();

      if (poolSize > 1) {
        const pool = new TabPool(client, poolSize, url, name);
        await pool.init();
        const siteObj = createSiteObject(name, url, client, "default", pool);
        _sites[name] = siteObj;
        piggy[name] = siteObj;
        logger.success(`[${name}] registered with pool of ${poolSize} tabs`);
      } else {
        const tabId = await client.newTab();
        const siteObj = createSiteObject(name, url, client, tabId);
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

  // ── Sub-APIs (1:1 with C++ files, available after launch/connect) ─────────

    get tabs()         { return _router?.tabs         ?? createTabsAPI(guardClient()); },
    get tab()         { return _router?.tabs         ?? createTabsAPI(guardClient()); },
  get navigation()   { return _router?.navigation   ?? createNavigationAPI(guardClient()); },
  get interactions() { return _router?.interactions ?? createInteractionsAPI(guardClient()); },
  get media()        { return _router?.media        ?? createMediaAPI(guardClient()); },
  get capture()      { return _router?.capture      ?? createCaptureAPI(guardClient()); },
  get find()         { return _router?.find         ?? createFindAPI(guardClient()); },
  get provide()      { return _router?.provide      ?? createProvideAPI(guardClient()); },
  get wait()         { return _router?.wait         ?? createWaitAPI(guardClient()); },
  get evaluate()     { return _router?.evaluate     ?? createEvaluateAPI(guardClient()); },
  get fetch()        { return _router?.fetch        ?? createFetchAPI(guardClient()); },
  get captcha()      { return _router?.captcha      ?? createCaptchaAPI(guardClient()); },
  get dialog()       { return _router?.dialog       ?? createDialogAPI(guardClient()); },
  get human()        { return _router?.human        ?? createHumanAPI(guardClient()); },
  get iframe()       { return _router?.iframe       ?? createIframeAPI(guardClient()); },
  get session()      { return _router?.session      ?? createSessionAPI(guardClient()); },
  get export()       { return _router?.export       ?? createExportAPI(guardClient()); },

  // ── Proxy (global, not per-tab) ───────────────────────────────────────────
  get proxy() {
    const api = _router?.proxy ?? createProxyAPI(guardClient());
    return {
      load:     (path: string)                                              => api.load(path),
      fetch:    (url: string)                                               => api.fetch(url),
      ovpn:     (path: string)                                              => api.ovpn(path),
      set:      (opts: Parameters<typeof api.set>[0])                       => api.set(opts),
      test:     ()                                                          => api.test(),
      testStop: ()                                                          => api.testStop(),
      next:     ()                                                          => api.next(),
      rotate:   ()                                                          => api.rotate(),
      disable:  ()                                                          => api.disable(),
      enable:   ()                                                          => api.enable(),
      current:  ()                                                          => api.current(),
      stats:    ()                                                          => api.stats(),
      list:     (limit?: number)                                            => api.list(limit),
      rotation: (mode: "none" | "timed" | "perrequest", interval?: number) => api.rotation(mode, interval),
      config:   (opts: { skipDead?: boolean; autoCheck?: boolean })         => api.config(opts),
      save:     (path: string, filter?: "alive" | "dead" | "all")          => api.save(path, filter),
      on:       (event: string, handler: (data: any) => void)              => guardClient().onProxyEvent(event, handler),
    };
  },

  // ── Global controls ───────────────────────────────────────────────────────
  actHuman: (enable: boolean) => {
    setHumanMode(enable);
    logger.info(`[piggy] actHuman: ${enable}`);
    return piggy;
  },

  mode: (m: TabMode) => { _tabMode = m; return piggy; },

  // ── Global expose ─────────────────────────────────────────────────────────
  expose: async (name: string, handler: (data: any) => Promise<any> | any, tabId = "default") => {
    await guardClient().exposeFunction(name, handler, tabId);
    logger.success(`[piggy] exposed global function: ${name}`);
    return piggy;
  },

  unexpose: async (name: string, tabId = "default") => {
    await guardClient().unexposeFunction(name, tabId);
    logger.info(`[piggy] unexposed function: ${name}`);
    return piggy;
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

  // ── Multi-site helpers ────────────────────────────────────────────────────
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
        _router = null;
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

type TypedPiggy<Sites extends string> = typeof piggy & {
  [K in Sites]: SiteObject;
};

export function usePiggy<Sites extends string>(): TypedPiggy<Sites> {
  return piggy as TypedPiggy<Sites>;
}

export type { SiteObject };
export default piggy;
export { piggy };