'use strict';

const { EventEmitter } = require('events');
const { PiggyClient }  = require('./client');
const { resolveBinary, spawnBinary } = require('./launcher');
const { createSite }   = require('./site');
const log = require('./logger');

class Piggy extends EventEmitter {
  constructor() {
    super();
    this._client    = null;
    this._proc      = null;
    this._sites     = {};
    this._plugins   = [];
    this._humanMode = false;
    this._tabMode   = 'tab';
  }

  // ── Launch (local) ────────────────────────────────────────────────────────

  async launch(opts = {}) {
    const { mode = 'tab', binary, args = [] } = opts;
    this._tabMode = mode;
    log.info(`Launching Nothing Browser (mode: ${mode})`);
    const binPath = resolveBinary(binary, mode);
    this._proc = await spawnBinary(binPath, { args });
    await new Promise(r => setTimeout(r, 1500));
    this._client = new PiggyClient();
    await this._client.connect();
    this._wireGlobalEvents();
    log.success('Piggy ready');
    return this;
  }

  // ── Connect (remote HTTP) ─────────────────────────────────────────────────

  async connect(opts = {}) {
    log.info(`Connecting to remote Piggy at ${opts.host}`);
    this._client = new PiggyClient({ host: opts.host, key: opts.key });
    await this._client.connect();
    this._wireGlobalEvents();
    log.success(`Remote connection established (${opts.host})`);
    return this;
  }

  // ── Wire global events ────────────────────────────────────────────────────

  _wireGlobalEvents() {
    const c = this._client;

    const proxyEvents = [
      'proxy:changed', 'proxy:loaded', 'proxy:fetch:failed',
      'proxy:check:started', 'proxy:check:done',
      'proxy:alive', 'proxy:dead', 'proxy:exhausted', 'proxy:ovpn:loaded',
    ];

    proxyEvents.forEach(ev => c.on(ev, d => {
      this.emit(ev, d);
      this.proxy.emit(ev, d);

      // User-visible proxy messages
      if (ev === 'proxy:changed')      log.network(`Proxy rotated → ${d.proxy} (${d.latency}ms)`);
      if (ev === 'proxy:exhausted')    log.warn('All proxies exhausted');
      if (ev === 'proxy:fetch:failed') log.error(`Proxy fetch failed: ${d.error}`);
      if (ev === 'proxy:dead')         log.warn(`Proxy ${d.index} dead (${d.latency}ms)`);
      if (ev === 'proxy:alive')        log.debug(`Proxy ${d.index} alive (${d.latency}ms)`);
      if (ev === 'proxy:check:done')   log.info(`Proxy check done: ${d.alive} alive, ${d.dead} dead`);
    }));

    c.on('navigate', d => {
      this.emit('navigate', d);
      log.debug(`Navigate → ${d.url} (tab: ${d.tabId})`);
    });

    c.on('captcha', d => {
      this.emit('captcha', d);
      log.warn(`CAPTCHA detected (${d.captchaType}) on tab ${d.tabId}`);
    });

    c.on('captcha:resolved', d => {
      this.emit('captcha:resolved', d);
      log.success(`CAPTCHA resolved on tab ${d.tabId}`);
    });

    c.on('blocked', d => {
      this.emit('blocked', d);
      log.warn(`Block detected (${d.blockType}) on tab ${d.tabId}`);
    });

    c.on('dialog', d => {
      this.emit('dialog', d);
      log.debug(`Dialog (${d.dialogType}): "${d.message}" on tab ${d.tabId}`);
    });

    c.on('exposed_call', d => {
      this.emit('exposed_call', d);
    });
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async register(name, url, opts = {}) {
    log.info(`Registering site: ${name} → ${url}`);
    const tabId = await this._client.send('tab.new', {
      binary: opts.binary,
      pool:   opts.pool,
    });
    const site = createSite(name, url, tabId, this._client, this);
    this._sites[name] = site;
    Object.defineProperty(this, name, { get: () => this._sites[name], configurable: true });
    log.success(`Site registered: ${name} (tab: ${tabId})`);
    return site;
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  async close(opts = {}) {
    log.info('Closing Piggy...');
    if (opts.force) {
      if (this._proc) { this._proc.kill('SIGKILL'); this._proc = null; }
    } else {
      await this._client?.send('close', {}).catch(() => {});
    }
    if (this._client) { this._client.close(); this._client = null; }
    if (this._proc)   { this._proc.kill();    this._proc   = null; }
    this._sites = {};
    log.success('Piggy closed');
  }

  // ── Detect binary ─────────────────────────────────────────────────────────

  detect(binary) {
    try { return resolveBinary(binary); } catch { return null; }
  }

  // ── Human mode ────────────────────────────────────────────────────────────

  actHuman(enable) {
    this._humanMode = !!enable;
    log.debug(`Human mode: ${enable ? 'ON' : 'OFF'}`);
    this._client?.send('human.global', { enabled: this._humanMode }).catch(() => {});
    return this;
  }

  // ── Tab mode ──────────────────────────────────────────────────────────────

  mode(m) {
    this._tabMode = m;
    log.debug(`Tab mode set: ${m}`);
    this._client?.send('mode.set', { mode: m }).catch(() => {});
    return this;
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  tabs = {
    new: () => {
      log.debug('Creating new tab');
      return this._client.send('tab.new', {});
    },
    list: () => this._client.send('tab.list', {}),
    close: (tabIdOrObj) => {
      const tabId = typeof tabIdOrObj === 'string' ? tabIdOrObj : tabIdOrObj?.tabId;
      log.debug(`Closing tab: ${tabId}`);
      return this._client.send('tab.close', { tabId });
    },
  };

  get tab() { return this.tabs; }

  // ── Proxy (global EventEmitter) ───────────────────────────────────────────

  proxy = Object.assign(new EventEmitter(), {
    load:    (filePath) => {
      log.info(`Loading proxies from: ${filePath}`);
      return this._client.send('proxy.load', { path: filePath });
    },
    fetch:   (url) => {
      log.info(`Fetching proxies from: ${url}`);
      return this._client.send('proxy.fetch', { url });
    },
    ovpn:    (filePath) => {
      log.info(`Loading OpenVPN config: ${filePath}`);
      return this._client.send('proxy.ovpn', { path: filePath });
    },
    set:     (proxy)            => this._client.send('proxy.set',      { proxy }),
    enable:  ()                 => this._client.send('proxy.enable',   {}),
    disable: ()                 => this._client.send('proxy.disable',  {}),
    test:    ()                 => { log.info('Starting proxy health check'); return this._client.send('proxy.test', {}); },
    testStop:()                 => this._client.send('proxy.test.stop', {}),
    next:    ()                 => { log.debug('Rotating to next proxy'); return this._client.send('proxy.next', {}); },
    rotation:(mode, interval)   => this._client.send('proxy.rotation', { mode, interval }),
    current: ()                 => this._client.send('proxy.current',  {}),
    stats:   ()                 => this._client.send('proxy.stats',    {}),
    list:    (limit)            => this._client.send('proxy.list',     { limit }),
    config:  (opts)             => this._client.send('proxy.config',   opts),
    save:    (filePath, filter) => this._client.send('proxy.save',     { path: filePath, filter }),
  });

  // ── API Server (built-in C++ Elysia server) ───────────────────────────────

  serve(port = 3000, opts = {}) {
    log.success(`Starting API server on port ${port}`);
    return this._client.send('serve', { port, ...opts });
  }

  stopServer() {
    log.info('Stopping API server');
    return this._client.send('stopServer', {});
  }

  routes() {
    return this._client.send('routes', {});
  }

  // ── Multi-site helpers ────────────────────────────────────────────────────

  all(sites) {
    return new Proxy({}, {
      get(_, method) {
        return (...args) => Promise.all(sites.map(s => s[method](...args)));
      },
    });
  }

  diff(sites) {
    return new Proxy({}, {
      get(_, method) {
        return (...args) => Promise.all(
          sites.map(s => s[method](...args).then(r => ({ name: s._name, result: r })))
        ).then(results => Object.fromEntries(results.map(r => [r.name, r.result])));
      },
    });
  }

  // ── Global expose ─────────────────────────────────────────────────────────

  expose(name, fn, tabId) {
    log.debug(`Exposing function globally: ${name}`);
    if (tabId) {
      const site = Object.values(this._sites).find(s => s._tabId === tabId);
      if (site) return site.exposeFunction(name, fn);
    }
    return Promise.all(Object.values(this._sites).map(s => s.exposeFunction(name, fn)));
  }

  unexpose(name, tabId) {
    if (tabId) {
      const site = Object.values(this._sites).find(s => s._tabId === tabId);
      if (site) return site.unexposeFunction(name);
    }
    return Promise.all(Object.values(this._sites).map(s => s.unexposeFunction(name)));
  }

  // ── onEvent ───────────────────────────────────────────────────────────────

  onEvent(eventName, tabId, handler) {
    if (typeof tabId === 'function') { handler = tabId; tabId = '*'; }
    this._client?.on(eventName, (d) => {
      if (tabId === '*' || d.tabId === tabId) handler(d);
    });
  }

  // ── usePiggy ─────────────────────────────────────────────────────────────

  usePiggy(name) {
    const site = this._sites[name];
    if (!site) {
      const msg = `Site '${name}' is not registered`;
      log.error(msg);
      throw new Error(msg);
    }
    return site;
  }

  // ── Extend (plugin) ───────────────────────────────────────────────────────

  extend(pluginFn, siteName) {
    const targets = siteName
      ? [this._sites[siteName]].filter(Boolean)
      : Object.values(this._sites);
    for (const site of targets) {
      const ext = pluginFn(site);
      if (ext && typeof ext === 'object') Object.assign(site, ext);
    }
    log.debug(`Plugin installed on ${siteName ?? 'all sites'}`);
  }

  // ── Identity & Profile ────────────────────────────────────────────────────

  identity = {
    set: (opts) => this._client.send('identity.set', opts),
    get: ()     => this._client.send('identity.get', {}),
  };
}

const piggy = new Piggy();
module.exports = piggy;
module.exports.default = piggy;
module.exports.Piggy = Piggy;
module.exports.log = log;
