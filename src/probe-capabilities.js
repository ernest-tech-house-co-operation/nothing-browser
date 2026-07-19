'use strict';
/**
 * Capability probe for Nothing Browser binary.
 *
 * Walks a list of every command site.js is capable of sending, fires each
 * one at the already-launched binary with harmless dummy args, and reports
 * which commands the binary recognizes vs which come back as
 * "unknown command: X". This turns "figure out what's missing" from manual
 * guesswork into a five-second automated report.
 *
 * Usage:
 *   node probe-capabilities.js
 *
 * Requires piggy.launch() + piggy.register() to succeed first (uses the
 * same binary/socket you already have working).
 */

const piggy = require('nothing-browser'); // uses the bun-linked package, same as test.js

// Every command string found in site.js's send(...) calls.
// Payloads are dummy/harmless — we only care whether the binary
// recognizes the command, not whether the args are semantically valid.
const COMMANDS = [
  ['navigate',            { url: 'about:blank' }],
  ['reload',              {}],
  ['go.back',             {}],
  ['go.forward',          {}],
  ['page.title',          {}],
  ['page.url',            {}],
  ['page.content',        {}],
  ['wait.navigation',     {}],
  ['wait.selector',       { selector: 'body', state: 'attached', timeout: 1000 }],
  ['wait.function',       { js: 'true', timeout: 1000 }],
  ['wait.response',       { pattern: '*' }],
  ['noclose',             {}],
  ['tab.poolStats',       {}],
  ['click',               { selector: 'body' }],
  ['dblclick',            { selector: 'body' }],
  ['hover',               { selector: 'body' }],
  ['type',                { selector: 'body', text: '' }],
  ['select',              { selector: 'body', value: '' }],
  ['scroll.to',           { selector: 'body' }],
  ['scroll.by',           { px: 0 }],
  ['keyboard.press',      { key: 'Escape' }],
  ['keyboard.combo',      { combo: 'Control+A' }],
  ['mouse.move',          { x: 0, y: 0 }],
  ['mouse.drag',          { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }],
  ['evaluate',            { js: '(function(){return true;})()' }],
  ['find.css',            { selector: 'body' }],
  ['find.all',            { selector: 'body' }],
  ['find.first',          { selector: 'body' }],
  ['find.byText',         { text: '' }],
  ['find.byAttr',         { attr: 'id', value: '' }],
  ['find.byTag',          { tag: 'body' }],
  ['find.byPlaceholder',  { text: '' }],
  ['find.byRole',         { role: 'button' }],
  ['find.closest',        { selector: 'body' }],
  ['find.parent',         { selector: 'body' }],
  ['find.children',       { selector: 'body' }],
  ['find.filter',         { selector: 'body' }],
  ['find.count',          { selector: 'body' }],
  ['find.exists',         { selector: 'body' }],
  ['find.visible',        { selector: 'body' }],
  ['find.enabled',        { selector: 'body' }],
  ['find.checked',        { selector: 'body' }],
  ['provide.text',        {}],
  ['provide.textAll',     {}],
  ['provide.attr',        {}],
  ['provide.attrAll',     {}],
  ['provide.html',        {}],
  ['provide.table',       {}],
  ['provide.list',        {}],
  ['provide.links',       {}],
  ['provide.images',      {}],
  ['provide.form',        {}],
  ['provide.page',        {}],
  ['provide.div',         {}],
  ['provide.meta',        {}],
  ['provide.select',      {}],
  ['provide.json',        {}],
  ['fetch.text',          { query: 'body' }],
  ['fetch.textAll',       { query: 'body' }],
  ['fetch.attr',          {}],
  ['fetch.attrAll',       {}],
  ['fetch.links',         { query: 'body' }],
  ['fetch.links.all',     {}],
  ['fetch.image',         { query: 'body' }],
  ['search.css',          {}],
  ['search.id',           { query: 'x' }],
  ['capture.start',       {}],
  ['capture.stop',        {}],
  ['capture.requests',    {}],
  ['capture.ws',          {}],
  ['capture.cookies',     {}],
  ['capture.storage',     {}],
  ['capture.clear',       {}],
  ['intercept.rule.add',  { pattern: '*', block: false }],
  ['intercept.rule.clear',{}],
  ['cookie.set',          { name: 'x', value: 'y' }],
  ['cookie.get',          { name: 'x' }],
  ['cookie.delete',       { name: 'x' }],
  ['cookie.list',         {}],
  ['session.export',      {}],
  ['session.import',      { data: {} }],
  ['session.reload',      {}],
  ['session.paths',       {}],
  ['session.cookiesPath', {}],
  ['session.profilePath', {}],
  ['session.wsPath',      {}],
  ['session.pingsPath',   {}],
  ['session.ws.save',     { enabled: true }],
  ['session.pings.save',  { enabled: true }],
  ['expose.function',     { name: '__probe_fn' }],
  ['addInitScript',       { js: '(function(){})()' }],
  ['iframe.list',         {}],
  ['iframe.evaluate',     {}],
  ['iframe.click',        {}],
  ['iframe.type',         {}],
  ['iframe.text',         {}],
  ['iframe.html',         {}],
  ['iframe.waitSel',      {}],
  ['captcha.status',      {}],
  ['captcha.blockStatus', {}],
  ['captcha.resolve',     { token: 'x' }],
  ['captcha.pause',       {}],
  ['captcha.check',       {}],
  ['captcha.autoRetry',   { enabled: true }],
  ['captcha.blockRetry',  {}],
  ['captcha.waitResolution', { timeout: 1000 }],
  ['block.status',        {}],
  ['block.retry',         {}],
  ['dialog.accept',       {}],
  ['dialog.dismiss',      {}],
  ['dialog.status',       {}],
  ['dialog.setAutoAction',{ action: 'dismiss' }],
  ['upload',              { selector: 'input', path: '/tmp/x' }],
  ['dialog.waitAndAccept',{ timeout: 1000 }],
  ['dialog.waitAndDismiss',{ timeout: 1000 }],
  ['human.set',           {}],
  ['human.get',           {}],
  ['human.type',          {}],
  ['human.click',         {}],
  ['screenshot',          {}],
  ['pdf',                 {}],
  ['block.images',        {}],
  ['unblock.images',      {}],
  ['qr.status',           {}],
  ['qr.force',            {}],
  ['storage.dump',        {}],
  ['storage.clear',       {}],
  ['api.register',        { path: '/probe', method: 'GET', handler: '() => {}' }],
  ['proxy.load',          { path: '/tmp/x' }],
  ['proxy.fetch',         { url: 'http://x' }],
  ['proxy.ovpn',          { path: '/tmp/x' }],
  ['proxy.set',           { proxy: '' }],
  ['proxy.enable',        {}],
  ['proxy.disable',       {}],
  ['proxy.test',          {}],
  ['proxy.test.stop',     {}],
  ['proxy.next',          {}],
  ['proxy.rotation',      { mode: 'manual' }],
  ['proxy.current',       {}],
  ['proxy.stats',         {}],
  ['proxy.list',          {}],
  ['proxy.config',        {}],
  ['proxy.save',          { path: '/tmp/x' }],
  ['media.start',         {}],
  ['media.stop',          {}],
  ['media.status',        {}],
  ['cookieinject.set',    { cookies: [] }],
  ['cookieinject.clear',  {}],
  ['tab.close',           {}], // careful: run this LAST or it'll kill the tab mid-probe
  ['close',               {}], // known already: unimplemented in this build
];

(async () => {
  await piggy.launch({ mode: 'tab', binary: 'headless' });
  const books = await piggy.register('probe', 'about:blank');

  const supported = [];
  const missing   = [];
  const errored   = []; // recognized but threw for other reasons — still "supported"

  // Commands that are designed to block until a condition is met — race
  // them against a short timeout so a command that will never resolve on
  // a blank/idle page (no navigation, no response, no dialog, ...) doesn't
  // hang the whole probe run.
  const BLOCKING_COMMANDS = new Set([
    'wait.navigation', 'wait.selector', 'wait.function', 'wait.response',
    'captcha.waitResolution', 'dialog.waitAndAccept', 'dialog.waitAndDismiss',
  ]);
  const PROBE_TIMEOUT_MS = 2000;

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('__probe_timeout__')), ms)),
    ]);
  }

  for (const [cmd, payload] of COMMANDS) {
    if (cmd === 'tab.close' || cmd === 'close') continue; // run separately, they end the session
    try {
      const call = books._send(cmd, payload);
      if (BLOCKING_COMMANDS.has(cmd)) {
        await withTimeout(call, PROBE_TIMEOUT_MS);
      } else {
        await call;
      }
      supported.push(cmd);
    } catch (e) {
      const msg = e.message || '';
      if (msg === '__probe_timeout__') {
        // Command exists and is blocking as designed — just never resolved
        // on our idle/blank test page. That's a probe limitation, not a gap.
        errored.push([cmd, '(supported, but blocked — no condition to satisfy on blank page)']);
        supported.push(cmd);
      } else if (/^unknown command/i.test(msg)) {
        missing.push(cmd);
      } else {
        // Command exists, just failed for a real reason (bad selector, etc.)
        errored.push([cmd, msg]);
        supported.push(cmd);
      }
    }
  }

  console.log('\n=== CAPABILITY REPORT ===\n');
  console.log(`✅ Supported (${supported.length}):`);
  console.log(supported.join(', '));
  console.log(`\n❌ Missing / unimplemented in this binary (${missing.length}):`);
  console.log(missing.join(', ') || '(none!)');
  console.log(`\n⚠️  Supported but errored on dummy args (${errored.length}) — expected, not a gap:`);
  errored.forEach(([c, m]) => console.log(`  ${c}: ${m}`));

  await piggy.close({ force: true });
})();