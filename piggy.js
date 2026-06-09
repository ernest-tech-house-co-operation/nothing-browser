'use strict';

const { detectBinary }                          = require("./piggy/launch/detect.js");
const { spawnBrowser, killBrowser,
        spawnBrowserOnSocket }                  = require("./piggy/launch/spawn.js");
const { PiggyClient }                           = require("./piggy/client/index.js");
const { setClient, setHumanMode,
        createSiteObject }                      = require("./piggy/register/index.js");
const { routeRegistry, keepAliveSites,
        startServer, stopServer }               = require("./piggy/server/index.js");
const { TabPool }                               = require("./piggy/pool/index.js");
const { createRouter }                          = require("./piggy/router/index.js");
const { createCaptureAPI }                      = require("./piggy/capture/index.js");
const { createCaptchaAPI }                      = require("./piggy/captcha/index.js");
const { createDialogAPI }                       = require("./piggy/dialog/index.js");
const { createExportAPI }                       = require("./piggy/export/index.js");
const { createFindAPI }                         = require("./piggy/find/index.js");
const { createHumanAPI }                        = require("./piggy/human/index.js");
const { createIframeAPI }                       = require("./piggy/iframe/index.js");
const { createInteractionsAPI }                 = require("./piggy/interactions/index.js");
const { createMediaAPI }                        = require("./piggy/media/index.js");
const { createNavigationAPI }                   = require("./piggy/navigation/index.js");
const { createProvideAPI }                      = require("./piggy/provide/index.js");
const { createProxyAPI }                        = require("./piggy/proxy/index.js");
const { createSessionAPI }                      = require("./piggy/session/index.js");
const { createTabsAPI }                         = require("./piggy/tabs/index.js");
const { createWaitAPI, createEvaluateAPI,
        createFetchAPI }                        = require("./piggy/wait/index.js");
const { createHttpClient }                      = require("./piggy/http/index.js");
const _loggerMod                                = require("./piggy/logger/index.js");
const logger                                    = _loggerMod.default ?? _loggerMod;

// ── State ─────────────────────────────────────────────────────────────────────

let _client         = null;
let _router         = null;
let _tabMode        = "tab";
let _singleSiteName = null;

const _extraProcs = [];
const _sites      = {};

// ── Internal helpers ──────────────────────────────────────────────────────────

function guardClient() {
  if (!_client) throw new Error("No client. Call piggy.launch() or piggy.connect() first.");
  return _client;
}

function buildAPIs(client) {
  _router = createRouter(client);
}

// ── piggy object ──────────────────────────────────────────────────────────────

const piggy = {

  // ── Local launch (unix socket) ────────────────────────────────────────────
  launch: async (opts = {}) => {
    _tabMode = opts.mode ?? "tab";
    const binaryMode = opts.binary ?? "headless";
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
  connect: async (opts) => {
    _tabMode = "tab";
    _client  = new PiggyClient({ host: opts.host, key: opts.key });
    await _client.connect();
    setClient(_client);
    buildAPIs(_client);
    logger.info(`[piggy] connected (HTTP) → ${opts.host}`);
    return piggy;
  },

  // ── HTTP client ───────────────────────────────────────────────────────────
  http: (opts) => createHttpClient(opts),

  // ── Register ──────────────────────────────────────────────────────────────
  register: async (name, url, opts = {}) => {
    if (!url?.trim()) throw new Error(`No URL for site "${name}"`);

    const binaryMode = opts.binary   ?? "headless";
    const poolSize   = opts.pool     ?? 0;
    const isSingle   = opts.single   === true;

    if (isSingle && _singleSiteName && _singleSiteName !== name) {
      throw new Error(
        `piggy: site "${_singleSiteName}" is already registered as single. ` +
        `Only one site may use { single: true } at a time.`
      );
    }

    if (_tabMode === "tab") {
      const client = guardClient();

      if (poolSize > 1) {
        if (isSingle) throw new Error('piggy: { single: true } is incompatible with pool > 1');
        const pool    = new TabPool(client, poolSize, url, name);
        await pool.init();
        const siteObj = createSiteObject(name, url, client, "default", pool);
        _sites[name]  = siteObj;
        piggy[name]   = siteObj;
        logger.success(`[${name}] registered with pool of ${poolSize} tabs`);
      } else {
        const tabId   = await client.newTab();
        const siteObj = createSiteObject(name, url, client, tabId);
        _sites[name]  = siteObj;
        piggy[name]   = siteObj;

        if (isSingle) {
          _singleSiteName = name;
          logger.success(`[${name}] registered as single-tab site (default tab)`);
        } else {
          logger.success(`[${name}] registered as tab ${tabId}`);
        }
      }
    } else {
      if (isSingle) throw new Error('piggy: { single: true } is only supported in tab mode');
      const socketName = `piggy_${name}`;
      await spawnBrowserOnSocket(socketName, binaryMode);
      await new Promise(r => setTimeout(r, 500));
      const c = new PiggyClient(socketName);
      await c.connect();
      _extraProcs.push({ socket: socketName, client: c });
      const siteObj = createSiteObject(name, url, c, "default");
      _sites[name]  = siteObj;
      piggy[name]   = siteObj;
      logger.success(`[${name}] registered as process on "${socketName}"`);
    }

    return piggy;
  },

  // ── extend() ─────────────────────────────────────────────────────────────
  extend: async (...installers) => {
    if (!_singleSiteName) {
      throw new Error(
        'piggy.extend() requires a site registered with { single: true }.\n' +
        'Example: await piggy.register("mysite", url, { single: true })'
      );
    }
    if (installers.length === 0) {
      logger.warn('[piggy] extend() called with no plugins — nothing to do');
      return piggy;
    }

    const site = _sites[_singleSiteName];
    if (!site) {
      throw new Error(`piggy.extend(): site "${_singleSiteName}" not found — register it first`);
    }

    // Inject _send before any installer runs so plugins can reach C++ commands.
    if (typeof site._send !== 'function') {
      const client = guardClient();
      const tabId  = site._tabId ?? 'default';
      site._send   = (cmd, payload = {}) => client.send(cmd, { tabId, ...payload });
    }

    for (const installer of installers) {
      if (typeof installer !== 'function') {
        throw new Error('piggy.extend(): each argument must be a plugin installer function');
      }
      await installer(site);
    }

    logger.success(`[piggy] ${installers.length} plugin(s) installed on "${_singleSiteName}"`);
    return piggy;
  },

  // ── Sub-APIs ──────────────────────────────────────────────────────────────
  get tabs()         { return _router?.tabs         ?? createTabsAPI(guardClient()); },
  get tab()          { return _router?.tabs         ?? createTabsAPI(guardClient()); },
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

  // ── Proxy ─────────────────────────────────────────────────────────────────
  get proxy() {
    const api = _router?.proxy ?? createProxyAPI(guardClient());
    return {
      load:     (path)                        => api.load(path),
      fetch:    (url)                         => api.fetch(url),
      ovpn:     (path)                        => api.ovpn(path),
      set:      (opts)                        => api.set(opts),
      test:     ()                            => api.test(),
      testStop: ()                            => api.testStop(),
      next:     ()                            => api.next(),
      rotate:   ()                            => api.rotate(),
      disable:  ()                            => api.disable(),
      enable:   ()                            => api.enable(),
      current:  ()                            => api.current(),
      stats:    ()                            => api.stats(),
      list:     (limit)                       => api.list(limit),
      rotation: (mode, interval)              => api.rotation(mode, interval),
      config:   (opts)                        => api.config(opts),
      save:     (path, filter)                => api.save(path, filter),
      on:       (event, handler)              => guardClient().onProxyEvent(event, handler),
    };
  },

  // ── Global controls ───────────────────────────────────────────────────────
  actHuman: (enable) => {
    setHumanMode(enable);
    logger.info(`[piggy] actHuman: ${enable}`);
    return piggy;
  },

  mode: (m) => { _tabMode = m; return piggy; },

  // ── Global expose ─────────────────────────────────────────────────────────
  expose: async (name, handler, tabId = "default") => {
    await guardClient().exposeFunction(name, handler, tabId);
    logger.success(`[piggy] exposed global function: ${name}`);
    return piggy;
  },

  unexpose: async (name, tabId = "default") => {
    await guardClient().unexposeFunction(name, tabId);
    logger.info(`[piggy] unexposed function: ${name}`);
    return piggy;
  },

  // ── Elysia server ─────────────────────────────────────────────────────────
  serve: (port, opts) => startServer(port, opts?.hostname, opts),

  stopServer,

  // ── Route listing ─────────────────────────────────────────────────────────
  routes: () =>
    Array.from(routeRegistry.entries()).map(([key, cfg]) => {
      const [site] = key.split(":");
      return {
        site,
        method:          cfg.method,
        path:            `/${site}${cfg.path}`,
        ttl:             cfg.ttl,
        middlewareCount: cfg.before.length,
      };
    }),

  // ── Multi-site helpers ────────────────────────────────────────────────────
  all: (sites) =>
    new Proxy({}, {
      get: (_, method) =>
        (...args) => Promise.all(sites.map(s => s[method]?.(...args))),
    }),

  diff: (sites) =>
    new Proxy({}, {
      get: (_, method) =>
        async (...args) => {
          const results = await Promise.all(sites.map(s => s[method]?.(...args)));
          return Object.fromEntries(sites.map((s, i) => [s._name ?? i, results[i]]));
        },
    }),

  // ── Shutdown ──────────────────────────────────────────────────────────────
  close: async (opts = {}) => {
    stopServer();
    _singleSiteName = null;
    if (opts.force) {
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

function usePiggy() {
  return piggy;
}

module.exports         = piggy;
module.exports.default = piggy;
module.exports.piggy   = piggy;
module.exports.usePiggy = usePiggy;