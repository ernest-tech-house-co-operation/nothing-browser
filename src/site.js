'use strict';

const { EventEmitter } = require('events');

function createSite(name, url, tabId, client, piggyInstance) {
  const emitter = new EventEmitter();

  // Forward tab-specific events from the global client
  const tabEvents = ['qr', 'qr:scanned', 'qr:timeout', 'dialog', 'captcha',
    'captcha:resolved', 'blocked', 'navigate', 'storage:loaded', 'storage:saved'];
  tabEvents.forEach(ev => {
    client.on(ev, (d) => { if (d.tabId === tabId) emitter.emit(ev, d.url ?? d); });
  });
  // proxy events are global (no tabId filter)
  ['proxy:changed','proxy:loaded','proxy:fetch:failed','proxy:check:started',
   'proxy:check:done','proxy:alive','proxy:dead','proxy:exhausted','proxy:ovpn:loaded',
  ].forEach(ev => client.on(ev, d => emitter.emit(ev, d)));

  function send(cmd, payload = {}) {
    return client.send(cmd, { tabId, ...payload });
  }

  const site = {
    _name:  name,
    _url:   url,
    _tabId: tabId,
    _send:  send,

    // ── EventEmitter ─────────────────────────────────────────────────────────
    on:   (...a) => { emitter.on(...a);   return site; },
    once: (...a) => { emitter.once(...a); return site; },
    off:  (...a) => { emitter.off(...a);  return site; },
    emit: (...a) => emitter.emit(...a),

    // ── Navigation ───────────────────────────────────────────────────────────
    navigate(targetUrl)   { return send('navigate',        { url: targetUrl ?? url }); },
    reload()              { return send('reload',          {}); },
    goBack()              { return send('go.back',         {}); },
    goForward()           { return send('go.forward',      {}); },
    title()               { return send('page.title',      {}); },
    url()                 { return send('page.url',        {}); },
    content()             { return send('page.content',    {}); },
    waitForNavigation()   { return send('wait.navigation', {}); },
    waitForSelector(selector, timeout) {
      return send('wait.selector', { selector, state: 'attached', timeout: timeout ?? 30000 });
    },
    waitForResponse(pattern) { return send('wait.response', { pattern }); },
    wait(ms)              { return new Promise(r => setTimeout(r, ms)); },
    noclose()             { return send('noclose', {}); },
    close()               { return send('tab.close', {}); },
    poolStats()           { return send('tab.poolStats', {}); },

    // ── Wait ─────────────────────────────────────────────────────────────────
    wait: Object.assign(
      (ms) => new Promise(r => setTimeout(r, ms)),
      {
        selector({ selector, state = 'attached', timeout = 30000 }) {
          return send('wait.selector', { selector, state, timeout });
        },
        function({ js, timeout = 30000 }) {
          return send('wait.function', { js, timeout });
        },
        response(pattern) { return send('wait.response', { pattern }); },
        navigation()      { return send('wait.navigation', {}); },
      }
    ),

    // ── Interactions ─────────────────────────────────────────────────────────
    click(selector, opts = {})            { return send('click',    { selector, ...opts }); },
    doubleClick(selector)                 { return send('dblclick', { selector }); },
    hover(selector)                       { return send('hover',    { selector }); },
    type(selector, text, opts = {})       { return send('type',     { selector, text, ...opts }); },
    select(selector, value)               { return send('select',   { selector, value }); },

    scroll: {
      to(selector)  { return send('scroll.to', { selector }); },
      by(px)        { return send('scroll.by', { px }); },
    },

    keyboard: {
      press(key)    { return send('keyboard.press', { key }); },
      combo(combo)  { return send('keyboard.combo', { combo }); },
    },

    mouse: {
      move(x, y)         { return send('mouse.move', { x, y }); },
      drag(from, to)     { return send('mouse.drag', { from, to }); },
    },

    evaluate(js, ...args) { return send('evaluate', { js, args }); },

    // ── Find ─────────────────────────────────────────────────────────────────
    find: {
      css(selector, _tabId)                  { return send('find.css',           { selector }); },
      all(selector, _tabId)                  { return send('find.all',           { selector }); },
      first(selector, _tabId)                { return send('find.first',         { selector }); },
      byText(opts, _tabId)                   { return send('find.byText',        opts); },
      byAttr(opts, _tabId)                   { return send('find.byAttr',        opts); },
      byTag(tag, _tabId)                     { return send('find.byTag',         { tag }); },
      byPlaceholder(text, _tabId)            { return send('find.byPlaceholder', { text }); },
      byRole(opts, _tabId)                   { return send('find.byRole',        opts); },
      closest(opts, _tabId)                  { return send('find.closest',       opts); },
      parent(selector, _tabId)               { return send('find.parent',        { selector }); },
      children(selector, _tabId)             { return send('find.children',      { selector }); },
      filter(opts, _tabId)                   { return send('find.filter',        opts); },
      count(selector, _tabId)                { return send('find.count',         { selector }); },
      exists(selector, _tabId)               { return send('find.exists',        { selector }); },
      visible(selector, _tabId)              { return send('find.visible',       { selector }); },
      enabled(selector, _tabId)              { return send('find.enabled',       { selector }); },
      checked(selector, _tabId)              { return send('find.checked',       { selector }); },
    },

    // ── Provide ──────────────────────────────────────────────────────────────
    provide: {
      text(opts)      { return send('provide.text',     opts); },
      textAll(opts)   { return send('provide.textAll',  opts); },
      attr(opts)      { return send('provide.attr',     opts); },
      attrAll(opts)   { return send('provide.attrAll',  opts); },
      html(opts)      { return send('provide.html',     opts); },
      table(opts)     { return send('provide.table',    opts); },
      list(opts)      { return send('provide.list',     opts); },
      links(opts)     { return send('provide.links',    opts ?? {}); },
      images(opts)    { return send('provide.images',   opts ?? {}); },
      form(opts)      { return send('provide.form',     opts); },
      page()          { return send('provide.page',     {}); },
      div(opts)       { return send('provide.div',      opts); },
      meta()          { return send('provide.meta',     {}); },
      select(opts)    { return send('provide.select',   opts); },
      json(opts)      { return send('provide.json',     opts ?? {}); },
    },

    // ── Fetch (legacy) ───────────────────────────────────────────────────────
    fetch: Object.assign(
      {},
      {
        text(opts)              { return send('fetch.text',     opts); },
        textAll(opts)           { return send('fetch.textAll',  opts); },
        attr(opts)              { return send('fetch.attr',     opts); },
        attrAll(opts)           { return send('fetch.attrAll',  opts); },
        links: Object.assign(
          (opts) => send('fetch.links', opts),
          { all: () => send('fetch.links.all', {}) }
        ),
        image(opts)             { return send('fetch.image',    opts); },
      }
    ),

    // ── Search (legacy) ──────────────────────────────────────────────────────
    search: {
      css(opts)  { return send('search.css', opts); },
      id(opts)   { return send('search.id',  opts); },
    },

    // ── Capture ──────────────────────────────────────────────────────────────
    capture: {
      start()    { return send('capture.start',    {}); },
      stop()     { return send('capture.stop',     {}); },
      requests() { return send('capture.requests', {}); },
      ws()       { return send('capture.ws',       {}); },
      cookies()  { return send('capture.cookies',  {}); },
      storage()  { return send('capture.storage',  {}); },
      clear()    { return send('capture.clear',    {}); },
    },

    // ── Intercept ────────────────────────────────────────────────────────────
    intercept: {
      block(pattern)                  { return send('intercept.rule.add', { pattern, block: true }); },
      redirect(pattern, redirectUrl)  { return send('intercept.rule.add', { pattern, redirect: redirectUrl }); },
      headers(pattern, headers)       { return send('intercept.rule.add', { pattern, setHeaders: headers }); },
      respond(pattern, response)      { return send('intercept.rule.add', { pattern, respond: response }); },
      modifyResponse(pattern, fn)     { return send('intercept.rule.add', { pattern, modifyResponse: fn?.toString() }); },
      clear(type)                     { return send('intercept.rule.clear', { type }); },
    },

    // ── Cookies ──────────────────────────────────────────────────────────────
    cookies: {
      set(name, value, domain, path)  { return send('cookie.set',    { name, value, domain, path }); },
      get(name, domain)               { return send('cookie.get',    { name, domain }); },
      delete(name, domain)            { return send('cookie.delete', { name, domain }); },
      list(domain)                    { return send('cookie.list',   { domain }); },
    },

    // ── Session ──────────────────────────────────────────────────────────────
    session: {
      export()                    { return send('session.export',       {}); },
      import(data)                { return send('session.import',       { data }); },
      reload()                    { return send('session.reload',       {}); },
      paths()                     { return send('session.paths',        {}); },
      cookiesPath()               { return send('session.cookiesPath',  {}); },
      profilePath()               { return send('session.profilePath',  {}); },
      wsPath()                    { return send('session.wsPath',       {}); },
      pingsPath()                 { return send('session.pingsPath',    {}); },
      setWsSave(enabled = true)   { return send('session.ws.save',     { enabled }); },
      setPingsSave(enabled = true){ return send('session.pings.save',  { enabled }); },
    },

    // ── Expose (RPC) ─────────────────────────────────────────────────────────
    _exposedListeners: {},

    exposeFunction(name, fn) {
      if (site._exposedListeners[name]) {
        client.removeListener('exposed_call', site._exposedListeners[name]);
      }
      const listener = async (d) => {
        if (d.tabId !== tabId || d.name !== name) return;
        let args = d.args ?? [];
        if (d.data !== undefined && d.data !== null) {
          if (typeof d.data === 'string') {
            try { args = [JSON.parse(d.data)]; } catch { args = [d.data]; }
          } else { args = [d.data]; }
        }
        try {
          const result = await fn(...args);
          send('exposed.result', { callId: d.callId, result: JSON.stringify(result ?? true), isError: false });
        } catch (e) {
          send('exposed.result', { callId: d.callId, result: String(e.message), isError: true });
        }
      };
      site._exposedListeners[name] = listener;
      client.on('exposed_call', listener);
      return send('expose.function', { name });
    },

    unexposeFunction(name) {
      if (site._exposedListeners[name]) {
        client.removeListener('exposed_call', site._exposedListeners[name]);
        delete site._exposedListeners[name];
      }
      return Promise.resolve();
    },

    clearExposedFunctions() {
      for (const name of Object.keys(site._exposedListeners)) {
        client.removeListener('exposed_call', site._exposedListeners[name]);
      }
      site._exposedListeners = {};
      return Promise.resolve();
    },

    exposeAndInject(name, fn, injectionJs) {
      const js = typeof injectionJs === 'function' ? injectionJs(name) : injectionJs;
      return site.exposeFunction(name, fn).then(() => send('addInitScript', { js }));
    },

    addInitScript(js) {
      const code = typeof js === 'function' ? `(${js.toString()})()` : js;
      return send('addInitScript', { js: code });
    },

    // ── Iframe ───────────────────────────────────────────────────────────────
    iframe: {
      list()              { return send('iframe.list',    {}); },
      evaluate(opts)      { return send('iframe.evaluate', opts); },
      click(opts)         { return send('iframe.click',    opts); },
      type(opts)          { return send('iframe.type',     opts); },
      text(opts)          { return send('iframe.text',     opts); },
      html(opts)          { return send('iframe.html',     opts); },
      waitSel(opts)       { return send('iframe.waitSel',  opts); },
    },

    // ── Captcha & Block ──────────────────────────────────────────────────────
    captcha: {
      status()                   { return send('captcha.status',           {}); },
      blockStatus()              { return send('captcha.blockStatus',      {}); },
      resolve(token)             { return send('captcha.resolve',          { token }); },
      pause()                    { return send('captcha.pause',            {}); },
      check()                    { return send('captcha.check',            {}); },
      setAutoRetry(v)            { return send('captcha.autoRetry',        { enabled: v }); },
      blockRetry()               { return send('captcha.blockRetry',       {}); },
      waitForResolution(timeout) { return send('captcha.waitResolution',   { timeout }); },
      onCaptcha(tabId, handler)  {
        client.on('captcha', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
      onCaptchaResolved(tabId, handler) {
        client.on('captcha:resolved', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
      onBlocked(tabId, handler)  {
        client.on('blocked', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
      onBlockRetry(tabId, handler) {
        client.on('block:retry', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
    },

    block: {
      status()  { return send('block.status', {}); },
      retry()   { return send('block.retry',  {}); },
    },

    // ── Dialog ───────────────────────────────────────────────────────────────
    dialog: {
      accept(text)          { return send('dialog.accept',        { text }); },
      dismiss()             { return send('dialog.dismiss',       {}); },
      status()              { return send('dialog.status',        {}); },
      setAutoAction(action) { return send('dialog.setAutoAction', { action }); },
      upload(selector, filePath) { return send('upload',          { selector, path: filePath }); },
      waitAndAccept(timeout)     { return send('dialog.waitAndAccept',  { timeout }); },
      waitAndDismiss(timeout)    { return send('dialog.waitAndDismiss', { timeout }); },
      onDialog(tabId, handler)   {
        client.on('dialog', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
    },

    // ── Human ────────────────────────────────────────────────────────────────
    human: {
      set(opts)                         { return send('human.set',   opts); },
      get()                             { return send('human.get',   {}); },
      type(opts)                        { return send('human.type',  opts); },
      click(opts)                       { return send('human.click', opts); },
    },

    // ── Screenshot & PDF ─────────────────────────────────────────────────────
    screenshot(filePath)  { return send('screenshot', filePath ? { path: filePath } : {}); },
    pdf(filePath)         { return send('pdf',        filePath ? { path: filePath } : {}); },
    blockImages()         { return send('block.images',   {}); },
    unblockImages()       { return send('unblock.images', {}); },

    // ── QR ───────────────────────────────────────────────────────────────────
    qr: {
      status()  { return send('qr.status', {}); },
      force()   { return send('qr.force',  {}); },
    },

    // ── Storage ──────────────────────────────────────────────────────────────
    storage: {
      dump()   { return send('storage.dump',  {}); },
      clear()  { return send('storage.clear', {}); },
    },

    // ── API Server (site-level) ───────────────────────────────────────────────
    api(path, handler, opts = {}) {
      return send('api.register', {
        path:   `/${name}${path}`,
        method: opts.method  || 'GET',
        ttl:    opts.ttl     || 0,
        detail: opts.detail  || {},
        before: (opts.before || []).map(fn => fn.toString()),
        handler: handler.toString(),
      });
    },

    // ── Proxy (per-tab) ───────────────────────────────────────────────────────
    proxy: {
      load(filePath)         { return send('proxy.load',      { path: filePath }); },
      fetch(url)             { return send('proxy.fetch',     { url }); },
      ovpn(filePath)         { return send('proxy.ovpn',      { path: filePath }); },
      set(proxy)             { return send('proxy.set',       { proxy }); },
      enable()               { return send('proxy.enable',    {}); },
      disable()              { return send('proxy.disable',   {}); },
      test()                 { return send('proxy.test',      {}); },
      testStop()             { return send('proxy.test.stop', {}); },
      next()                 { return send('proxy.next',      {}); },
      rotation(mode, interval) { return send('proxy.rotation', { mode, interval }); },
      current()              { return send('proxy.current',   {}); },
      stats()                { return send('proxy.stats',     {}); },
      list(limit)            { return send('proxy.list',      { limit }); },
      config(opts)           { return send('proxy.config',    opts); },
      save(filePath, filter) { return send('proxy.save',      { path: filePath, filter }); },
    },

    // ── Media ────────────────────────────────────────────────────────────────
    media: {
      start(opts = {})  { return send('media.start',  opts); },
      stop()            { return send('media.stop',   {}); },
      status()          { return send('media.status', {}); },
    },

    // ── Cookie inject ─────────────────────────────────────────────────────────
    cookieinject: {
      set(cookies)  { return send('cookieinject.set',   { cookies }); },
      clear()       { return send('cookieinject.clear', {}); },
    },
  };

  return site;
}

module.exports = { createSite };
