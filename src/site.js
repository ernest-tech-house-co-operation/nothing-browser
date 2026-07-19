'use strict';

const { EventEmitter } = require('events');

function createSite(name, url, tabId, client, piggyInstance) {
  const emitter = new EventEmitter();

  // Forward tab-specific events from the global client
  const tabEvents = ['dialog', 'navigate', 'storage:loaded', 'storage:saved'];
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
    refresh()             { return send('refresh',         {}); },
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
    //run in dev tools this is another map of evaluate not what i was thinking the fix will be an evaluate but this is not the last time am doing this this wi take a major shift sonner or later because i dont want to run in page context instead i want console context i wonder why people are not seeing the diffrence fom my POV BUT HMM NO WORRIES 
    // Alias — same mechanism as evaluate(), named for the DWR-bypass use case
    // (iTax-style portals). Runs a fetch from inside the tab's own JS context,
    // inheriting whatever session/CSRF cookies the browser already holds.
    runjs: {
      indevtools(fn, ...args) {
        return site.evaluate(fn, ...args);
      },
    },

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

    evaluate(fn, ...args) {
  const code = typeof fn === 'function'
    ? `(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(',')})`
    : fn;
  return send('evaluate', { js: code });
},

    // ── Find (boolean existence/state checks only) ──────────────────────────
    find: {
      exists(selector)               { return send('find.exists',   { selector }); },
      matches(selector)               { return send('find.matches',  { selector }); },
      visible(selector)               { return send('find.visible',  { selector }); },
      enabled(selector)               { return send('find.enabled',  { selector }); },
      checked(selector)               { return send('find.checked',  { selector }); },
      hasClass(selector, className)   { return send('find.hasClass', { selector, className }); },
      hasAttr(selector, attr)         { return send('find.hasAttr',  { selector, attr }); },
      hasText(selector, text) {
        // selector optional — omit to search the whole body
        if (text === undefined) { text = selector; selector = undefined; }
        return send('find.hasText', { selector, text });
      },
    },

    // ── Provide (actual data extraction) ─────────────────────────────────────
    provide: {
      text(selector)              { return send('provide.text',     { selector }); },
      textAll(selector)           { return send('provide.textAll',  { selector }); },
      attr(selector, attr)        { return send('provide.attr',     { selector, attr }); },
      attrAll(selector, attr)     { return send('provide.attrAll',  { selector, attr }); },
      html(selector, opts = {})   { return send('provide.html',     { selector, ...opts }); },
      table(selector)             { return send('provide.table',    { selector }); },
      list(selector)              { return send('provide.list',     { selector }); },
      links(selector)             { return send('provide.links',    selector ? { selector } : {}); },
      images(selector)            { return send('provide.images',   selector ? { selector } : {}); },
      form(selector)              { return send('provide.form',     { selector }); },
      page()                      { return send('provide.page',     {}); },
      div(selector)               { return send('provide.div',      { selector }); },
      meta()                      { return send('provide.meta',     {}); },
      select(selector)            { return send('provide.select',   { selector }); },
      json(selector)              { return send('provide.json',     { selector }); },

      // moved here from find.* — these return actual data, not booleans
      count(selector)             { return send('provide.count',    { selector }); },
      first(selector)             { return send('provide.first',    { selector }); },
      all(selector)                { return send('provide.all',      { selector }); },
      closest(selector, ancestorSelector) {
        return send('provide.closest', { selector, ancestorSelector });
      },
      parent(selector)            { return send('provide.parent',   { selector }); },
      children(selector)          { return send('provide.children', { selector }); },
      filter(selector, filter)    { return send('provide.filter',   { selector, filter }); },
      byRole(role)                 { return send('provide.byRole',   { role }); },
      byTag(tag)                  { return send('provide.byTag',    { tag }); },
      byPlaceholder(text)         { return send('provide.byPlaceholder', { text }); },
      byAttr(attr, value)         { return send('provide.byAttr',   { attr, value }); },
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

    // ── Session ──────────────────────────────────────────────────────────────
    session: {
      export()                    { return send('session.export',       {}); },
      import(data)                { return send('session.import',       { data }); },
      reload()                    { return send('session.reload',       {}); },
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

    // ── Dialog ───────────────────────────────────────────────────────────────
    dialog: {
      accept(text)          { return send('dialog.accept',        { text }); },
      dismiss()             { return send('dialog.dismiss',       {}); },
      status()              { return send('dialog.status',        {}); },
      setAutoAction(action) { return send('dialog.setAutoAction', { action }); },
      upload(selector, filePath) { return send('upload',          { selector, path: filePath }); },
      waitAndAccept(timeout, text)  { return send('dialog.waitAndAccept',  { timeout, text }); },
      waitAndDismiss(timeout)       { return send('dialog.waitAndDismiss', { timeout }); },
      onDialog(tabId, handler)   {
        client.on('dialog', d => { if (d.tabId === tabId || tabId === '*') handler(d); });
      },
    },

    // ── Screenshot & PDF ─────────────────────────────────────────────────────
    screenshot(filePath)  { return send('screenshot', filePath ? { path: filePath } : {}); },
    pdf(filePath)         { return send('pdf',        filePath ? { path: filePath } : {}); },
    blockImages()         { return send('block.images',   {}); },
    unblockImages()       { return send('unblock.images', {}); },

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
  };

  return site;
}

module.exports = { createSite };