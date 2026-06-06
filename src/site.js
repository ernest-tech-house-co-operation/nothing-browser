'use strict';

const { EventEmitter } = require('events');

/**
 * Builds the full site object from a tabId and client.
 * This is what piggy.mysite gives you — all the dot-notation APIs.
 */
function createSite(name, url, tabId, client, piggyInstance) {
  const emitter = new EventEmitter();

  // Forward tab-specific events from the global client
  client.on('qr',        (d) => { if (d.tabId === tabId) emitter.emit('qr', d); });
  client.on('qr:scanned',(d) => { if (d.tabId === tabId) emitter.emit('qr:scanned', d); });
  client.on('qr:timeout',(d) => { if (d.tabId === tabId) emitter.emit('qr:timeout', d); });
  client.on('dialog',    (d) => { if (d.tabId === tabId) emitter.emit('dialog', d); });
  client.on('captcha',   (d) => { if (d.tabId === tabId) emitter.emit('captcha', d); });
  client.on('navigate',  (d) => { if (d.tabId === tabId) emitter.emit('navigate', d); });
  client.on('proxy:changed',      (d) => emitter.emit('proxy:changed', d));
  client.on('proxy:loaded',       (d) => emitter.emit('proxy:loaded', d));
  client.on('proxy:fetch:failed', (d) => emitter.emit('proxy:fetch:failed', d));
  client.on('storage:loaded',     (d) => { if (d.tabId === tabId) emitter.emit('storage:loaded', d); });
  client.on('storage:saved',      (d) => { if (d.tabId === tabId) emitter.emit('storage:saved', d); });
  client.on('exposed_call', (d)  => { if (d.tabId === tabId) emitter.emit('exposed_call', d); });

  function send(cmd, payload = {}) {
    return client.send(cmd, { tabId, ...payload });
  }

  const site = {
    _name:  name,
    _url:   url,
    _tabId: tabId,
    _send:  send,

    // EventEmitter passthrough
    on:            (...a) => emitter.on(...a),
    once:          (...a) => emitter.once(...a),
    off:           (...a) => emitter.off(...a),
    emit:          (...a) => emitter.emit(...a),

    // ── Navigation ────────────────────────────────────────────────────────────
    navigate(targetUrl)  { return send('navigate', { url: targetUrl ?? url }); },
    reload()             { return send('reload'); },
    goBack()             { return send('go.back'); },
    goForward()          { return send('go.forward'); },
    url()                { return send('page.url'); },
    title()              { return send('page.title'); },
    content()            { return send('page.content'); },
    waitForNavigation()  { return send('wait.navigation'); },

    // ── Waiting ───────────────────────────────────────────────────────────────
    wait: {
      selector(selector, opts = {}) {
        return send('wait.selector', { selector, ...opts });
      },
      function(js, opts = {}) {
        return send('wait.function', { js, ...opts });
      },
      response() {
        return send('wait.response');
      },
    },

    waitForResponse() { return send('wait.response'); },

    // ── Interactions ──────────────────────────────────────────────────────────
    click(selector)          { return send('click',    { selector }); },
    dblclick(selector)       { return send('dblclick', { selector }); },
    hover(selector)          { return send('hover',    { selector }); },
    type(selector, text, opts = {}) {
      return send('type', { selector, text, ...opts });
    },
    select(selector, value)  { return send('select',   { selector, value }); },

    scroll: {
      to(selector)  { return send('scroll.to', { selector }); },
      by(px)        { return send('scroll.by', { px }); },
    },

    keyboard: {
      press(key)    { return send('keyboard.press', { key }); },
      combo(combo)  { return send('keyboard.combo', { combo }); },
    },

    mouse: {
      move(x, y)             { return send('mouse.move', { x, y }); },
      drag(from, to)         { return send('mouse.drag', { from, to }); },
    },

    evaluate(js, opts = {})  { return send('evaluate', { js, ...opts }); },

    // ── Find ─────────────────────────────────────────────────────────────────
    find: {
      css(selector)                     { return send('find.css',           { selector }); },
      all(selector)                     { return send('find.all',           { selector }); },
      first(selector)                   { return send('find.first',         { selector }); },
      byText(text, opts = {})           { return send('find.byText',        { text, ...opts }); },
      byAttr(attr, value, opts = {})    { return send('find.byAttr',        { attr, value, ...opts }); },
      byTag(tag)                        { return send('find.byTag',         { tag }); },
      byPlaceholder(text)               { return send('find.byPlaceholder', { text }); },
      byRole(role, opts = {})           { return send('find.byRole',        { role, ...opts }); },
      closest(selector, ancestor)       { return send('find.closest',       { selector, ancestor }); },
      parent(selector)                  { return send('find.parent',        { selector }); },
      children(selector)                { return send('find.children',      { selector }); },
      filter(selector, attr, value)     { return send('find.filter',        { selector, attr, value }); },
      count(selector)                   { return send('find.count',         { selector }); },
      exists(selector)                  { return send('find.exists',        { selector }); },
      visible(selector)                 { return send('find.visible',       { selector }); },
      enabled(selector)                 { return send('find.enabled',       { selector }); },
      checked(selector)                 { return send('find.checked',       { selector }); },
    },

    // ── Provide ───────────────────────────────────────────────────────────────
    provide: {
      text(selector)                    { return send('provide.text',     { selector }); },
      textAll(selector)                 { return send('provide.textAll',  { selector }); },
      attr(selector, attr)              { return send('provide.attr',     { selector, attr }); },
      attrAll(selector, attr)           { return send('provide.attrAll',  { selector, attr }); },
      html(selector)                    { return send('provide.html',     { selector }); },
      table(selector)                   { return send('provide.table',    { selector }); },
      list(selector, opts = {})         { return send('provide.list',     { selector, ...opts }); },
      links(selector)                   { return send('provide.links',    { selector }); },
      images(selector)                  { return send('provide.images',   { selector }); },
      form(selector)                    { return send('provide.form',     { selector }); },
      page()                            { return send('provide.page',     {}); },
      div(selector)                     { return send('provide.div',      { selector }); },
      meta()                            { return send('provide.meta',     {}); },
      select(selector)                  { return send('provide.select',   { selector }); },
      json(selector)                    { return send('provide.json',     { selector }); },
    },

    // ── Fetch (legacy) ────────────────────────────────────────────────────────
    fetch: {
      text(selector)     { return send('fetch.text',      { query: selector }); },
      textAll(selector)  { return send('fetch.textAll',   { selector }); },
      links(selector)    { return send('fetch.links',     { query: selector }); },
      linksAll()         { return send('fetch.links.all', {}); },
      image(selector)    { return send('fetch.image',     { query: selector }); },
      attr(selector, attr, opts = {}) { return send('fetch.attr', { selector, attr, ...opts }); },
      attrAll(selector, attr)         { return send('fetch.attrAll', { selector, attr }); },
    },

    // ── Search (legacy DOM snapshot) ──────────────────────────────────────────
    search: {
      css()       { return send('search.css', {}); },
      id(query)   { return send('search.id',  { query }); },
    },

    // ── Capture ───────────────────────────────────────────────────────────────
    capture: {
      start()     { return send('capture.start',    {}); },
      stop()      { return send('capture.stop',     {}); },
      requests()  { return send('capture.requests', {}); },
      ws()        { return send('capture.ws',       {}); },
      cookies()   { return send('capture.cookies',  {}); },
      storage()   { return send('capture.storage',  {}); },
      clear()     { return send('capture.clear',    {}); },
    },

    // ── Intercept ─────────────────────────────────────────────────────────────
    intercept: {
      block(pattern)            { return send('intercept.rule.add', { pattern, block: true }); },
      redirect(pattern, url)    { return send('intercept.rule.add', { pattern, redirect: url }); },
      headers(pattern, headers) { return send('intercept.rule.add', { pattern, setHeaders: headers }); },
      respond(pattern, body)    { return send('intercept.rule.add', { pattern, respond: body }); },
      modifyResponse(pattern, fn) { return send('intercept.rule.add', { pattern, modifyResponse: fn?.toString() }); },
      clear()                   { return send('intercept.rule.clear', {}); },
    },

    // ── Cookies ───────────────────────────────────────────────────────────────
    cookies: {
      set(opts)              { return send('cookie.set',    opts); },
      get(name, domain)      { return send('cookie.get',    { name, domain }); },
      delete(name, domain)   { return send('cookie.delete', { name, domain }); },
      list(domain)           { return send('cookie.list',   { domain }); },
    },

    // ── Session ───────────────────────────────────────────────────────────────
    session: {
      export()                    { return send('session.export',       {}); },
      import(data)                { return send('session.import',       { data }); },
      reload()                    { return send('session.reload',       {}); },
      paths()                     { return send('session.paths',        {}); },
      setWsSave(enabled = true)   { return send('session.ws.save',     { enabled }); },
      setPingsSave(enabled = true){ return send('session.pings.save',  { enabled }); },
    },

    // ── Expose (RPC) ──────────────────────────────────────────────────────────
    exposeFunction(name, fn) {
      client.on('exposed_call', async (d) => {
        if (d.tabId !== tabId || d.name !== name) return;
        try {
          const result = await fn(...(d.args ?? []));
          send('exposed.result', { callId: d.callId, result: String(result ?? ''), isError: false });
        } catch (e) {
          send('exposed.result', { callId: d.callId, result: String(e.message), isError: true });
        }
      });
      return send('expose.function', { name });
    },

    exposeAndInject(name, fn, js) {
      return site.exposeFunction(name, fn).then(() => send('addInitScript', { js }));
    },

    addInitScript(js) { return send('addInitScript', { js }); },

    // ── Iframe ────────────────────────────────────────────────────────────────
    iframe: {
      list()                          { return send('iframe.list',    {}); },
      evaluate(index, js)             { return send('iframe.evaluate',{ index, js }); },
      click(index, selector)          { return send('iframe.click',   { index, selector }); },
      type(index, selector, text)     { return send('iframe.type',    { index, selector, text }); },
      text(index, selector)           { return send('iframe.text',    { index, selector }); },
      html(index, selector)           { return send('iframe.html',    { index, selector }); },
      waitSel(index, selector, opts)  { return send('iframe.waitSel', { index, selector, ...opts }); },
    },

    // ── Captcha & Block ───────────────────────────────────────────────────────
    captcha: {
      status()             { return send('captcha.status',      {}); },
      resolve(token)       { return send('captcha.resolve',     { token }); },
      pause()              { return send('captcha.pause',       {}); },
      check()              { return send('captcha.check',       {}); },
      setAutoRetry(v)      { return send('captcha.autoRetry',   { enabled: v }); },
    },

    block: {
      status()   { return send('block.status', {}); },
      retry()    { return send('block.retry',  {}); },
    },

    // ── Dialog & Upload ───────────────────────────────────────────────────────
    dialog: {
      accept(text)         { return send('dialog.accept',        { text }); },
      dismiss()            { return send('dialog.dismiss',       {}); },
      status()             { return send('dialog.status',        {}); },
      upload(selector, filePath) { return send('upload', { selector, path: filePath }); },
      waitAndAccept(opts)  { return send('dialog.waitAndAccept', opts ?? {}); },
      waitAndDismiss(opts) { return send('dialog.waitAndDismiss',opts ?? {}); },
    },

    // ── Human mode ────────────────────────────────────────────────────────────
    human: {
      set(opts)                       { return send('human.set',  opts); },
      get()                           { return send('human.get',  {}); },
      type(selector, text, opts = {}) { return send('human.type', { selector, text, ...opts }); },
      click(selector, opts = {})      { return send('human.click',{ selector, ...opts }); },
    },

    // ── Screenshot & PDF ──────────────────────────────────────────────────────
    screenshot(opts = {})   { return send('screenshot',    opts); },
    pdf(opts = {})          { return send('pdf',           opts); },
    blockImages()           { return send('block.images',  {}); },
    unblockImages()         { return send('unblock.images',{}); },

    // ── QR (built-in C++ detector) ────────────────────────────────────────────
    qr: {
      status()  { return send('qr.status', {}); },
      force()   { return send('qr.force',  {}); },
    },

    // ── Storage (nothing-innerstorage) ────────────────────────────────────────
    storage: {
      dump()    { return send('storage.dump',  {}); },
      clear()   { return send('storage.clear', {}); },
    },

    // ── Media capture ─────────────────────────────────────────────────────────
    media: {
      start(opts = {})  { return send('media.start',  opts); },
      stop()            { return send('media.stop',   {}); },
      status()          { return send('media.status', {}); },
    },

    // ── Cookie inject ─────────────────────────────────────────────────────────
    cookieinject: {
      set(cookies)   { return send('cookieinject.set',  { cookies }); },
      clear()        { return send('cookieinject.clear', {}); },
    },

    // ── Proxy (per-tab convenience — global proxy lives on piggy directly) ────
    proxy: {
      load(filePath)          { return send('proxy.load',     { path: filePath }); },
      fetch(url)              { return send('proxy.fetch',    { url }); },
      ovpn(filePath)          { return send('proxy.ovpn',     { path: filePath }); },
      set(proxy)              { return send('proxy.set',      { proxy }); },
      enable()                { return send('proxy.enable',   {}); },
      disable()               { return send('proxy.disable',  {}); },
      test()                  { return send('proxy.test',     {}); },
      testStop()              { return send('proxy.test.stop',{}); },
      next()                  { return send('proxy.next',     {}); },
      rotation(opts = {})     { return send('proxy.rotation', opts); },
      current()               { return send('proxy.current',  {}); },
      stats()                 { return send('proxy.stats',    {}); },
      list()                  { return send('proxy.list',     {}); },
      save(filePath)          { return send('proxy.save',     { path: filePath }); },
    },
  };

  return site;
}

module.exports = { createSite };
