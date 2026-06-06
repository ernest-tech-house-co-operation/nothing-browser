'use strict';

const { EventEmitter } = require('events');
const { PiggyClient }  = require('./client');
const { resolveBinary, spawnBinary } = require('./launcher');
const { createSite }   = require('./site');

class Piggy extends EventEmitter {
  constructor() {
    super();
    this._client  = null;
    this._proc    = null;
    this._sites   = {};   // name -> site object
    this._routes  = {};   // path -> handler  (built-in API server)
    this._store   = {};   // site name -> store schema instances
    this._plugins = [];   // installed plugin extensions
  }

  // ── Core ──────────────────────────────────────────────────────────────────

  /**
   * Start the Nothing Browser binary and connect.
   * @param {Object} opts
   * @param {'tab'|'headless'|'headful'} [opts.mode='tab']
   * @param {string} [opts.binary]   Path to the binary, or 'headless'/'headful'
   * @param {string[]} [opts.args]   Extra CLI args to pass to the binary
   */
  async launch(opts = {}) {
    const { mode = 'tab', binary, args = [] } = opts;
    const binPath = resolveBinary(binary, mode);
    this._proc = await spawnBinary(binPath, { args });
    this._client = new PiggyClient();
    await this._client.connect();

    // Forward global events
    this._client.on('proxy:changed',      (d) => this.emit('proxy:changed', d));
    this._client.on('proxy:loaded',       (d) => this.emit('proxy:loaded', d));
    this._client.on('proxy:fetch:failed', (d) => this.emit('proxy:fetch:failed', d));
  }

  /**
   * Connect to an already-running Nothing Browser binary (remote or local).
   * @param {Object} [opts]
   * @param {string} [opts.host]  For remote HTTP API mode
   * @param {number} [opts.port]
   */
  async connect(opts = {}) {
    this._client = new PiggyClient(opts);
    await this._client.connect();
  }

  /**
   * Register a site and attach it as a dot-notation property.
   * @param {string} name          e.g. 'amazon'
   * @param {string} url           e.g. 'https://amazon.com'
   * @param {Object} [opts]
   * @param {boolean} [opts.single]  Reuse single tab
   */
  async register(name, url, opts = {}) {
    // Ask the binary for a tab
    const tabId = opts.single
      ? (await this._client.send('tab.list', {}))?.[0] ?? await this._client.send('tab.new', {})
      : await this._client.send('tab.new', {});

    const site = createSite(name, url, tabId, this._client, this);
    this._sites[name] = site;

    // Dot-notation access: piggy.amazon.*
    Object.defineProperty(this, name, { get: () => this._sites[name], configurable: true });

    return site;
  }

  /**
   * Install a plugin onto a registered site (or all sites if no target).
   * @param {Function} pluginFn   Result of e.g. qrcpp({ onQR: ... })
   * @param {string}  [siteName]  If omitted, applies to all registered sites
   */
  extend(pluginFn, siteName) {
    const targets = siteName
      ? [this._sites[siteName]].filter(Boolean)
      : Object.values(this._sites);

    for (const site of targets) {
      const extension = pluginFn(site);
      if (extension && typeof extension === 'object') {
        Object.assign(site, extension);
      }
    }
  }

  /**
   * Shut down the binary and socket.
   */
  async close() {
    if (this._client) { this._client.close(); this._client = null; }
    if (this._proc)   { this._proc.kill();    this._proc   = null; }
    this._sites = {};
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  tabs = {
    new:   ()         => this._client.send('tab.new',   {}),
    list:  ()         => this._client.send('tab.list',  {}),
    close: (tabId)    => this._client.send('tab.close', { tabId }),
  };

  // ── Proxy (global) ────────────────────────────────────────────────────────

  proxy = {
    load:     (filePath)      => this._client.send('proxy.load',      { path: filePath }),
    fetch:    (url)           => this._client.send('proxy.fetch',      { url }),
    ovpn:     (filePath)      => this._client.send('proxy.ovpn',      { path: filePath }),
    set:      (proxy)         => this._client.send('proxy.set',        { proxy }),
    enable:   ()              => this._client.send('proxy.enable',     {}),
    disable:  ()              => this._client.send('proxy.disable',    {}),
    test:     ()              => this._client.send('proxy.test',       {}),
    testStop: ()              => this._client.send('proxy.test.stop',  {}),
    next:     ()              => this._client.send('proxy.next',       {}),
    rotation: (opts = {})     => this._client.send('proxy.rotation',   opts),
    current:  ()              => this._client.send('proxy.current',    {}),
    stats:    ()              => this._client.send('proxy.stats',      {}),
    list:     ()              => this._client.send('proxy.list',       {}),
    save:     (filePath)      => this._client.send('proxy.save',       { path: filePath }),
  };

  // ── Built-in API server ────────────────────────────────────────────────────

  /**
   * Register a GET/POST handler on the built-in HTTP server.
   * @param {string}   path
   * @param {Function} handler  async (req) => any
   */
  api(path, handler) {
    this._routes[path] = handler;
  }

  routes() {
    return Object.keys(this._routes);
  }

  serve(port = 3000) {
    return this._client.send('serve', { port });
  }

  stopServer() {
    return this._client.send('stopServer', {});
  }

  // ── Multi-site helpers ────────────────────────────────────────────────────

  /**
   * Run fn on all registered sites concurrently, return array of results.
   */
  async all(fn) {
    return Promise.all(Object.values(this._sites).map(fn));
  }

  /**
   * Run fn on two sites and return a diff of the results.
   */
  async diff(siteA, siteB, fn) {
    const [a, b] = await Promise.all([fn(this._sites[siteA]), fn(this._sites[siteB])]);
    return { [siteA]: a, [siteB]: b };
  }

  // ── Global expose ─────────────────────────────────────────────────────────

  expose(name, fn) {
    return this.all((site) => site.exposeFunction(name, fn));
  }

  unexpose(name) {
    // No C++ unexpose command yet — best effort
    return Promise.resolve();
  }

  // ── onEvent (global) ──────────────────────────────────────────────────────

  onEvent(eventName, handler) {
    this._client?.on(eventName, handler);
  }

  // ── usePiggy (typed site accessor) ───────────────────────────────────────

  usePiggy(name) {
    const site = this._sites[name];
    if (!site) throw new Error(`Site '${name}' is not registered`);
    return site;
  }

  // ── Identity & Profile ────────────────────────────────────────────────────

  identity = {
    set: (opts) => this._client.send('identity.set', opts),
    get: ()     => this._client.send('identity.get', {}),
  };
}

// Singleton export — matches the original nothing-browser pattern
const piggy = new Piggy();
module.exports = piggy;
module.exports.default = piggy;
module.exports.Piggy = Piggy;
