// piggy/register/index.ts  →  stripped to JS
import { PiggyClient } from "../client";
import { HumanClient } from "../human";
import logger from "../logger";
import { routeRegistry, keepAliveSites } from "../server";
import { buildRespondScript, buildModifyResponseScript } from "../intercept/scripts";
import { storeRecord } from "../store";
import { TabPool } from "../pool";
import { createFindAPI } from "../find";
import { createProvideAPI } from "../provide";
import { createHumanAPI } from "../human";
import { createSessionAPI } from "../session";
import { DialogClient } from "../dialog";
import { createIframeAPI } from "../iframe";
import { exposeFunction, unexposeFunction, clearExposedFunctions, exposeAndInject } from "../expose";
import { createCaptchaAPI } from "../captcha";

let globalClient = null;
export let humanMode = false;

export function setClient(c) { globalClient = c; }
export function setHumanMode(v) { humanMode = v; }

async function retry(label, fn, retries = 2, backoff = 150) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      if (i < retries) {
        logger.warn(`[${label}] retry ${i + 1}/${retries}: ${e.message}`);
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
      }
    }
  }
  throw last;
}

export function createSiteObject(name, registeredUrl, client, tabId, pool) {
  let _currentUrl = registeredUrl;
  let _modifyRuleCounter = 0;

  function withTab(fn) {
    return pool ? pool.withTab(fn) : fn(tabId);
  }

  const _eventListeners = new Map();

  const _unsubNavigate = client.onEvent("navigate", tabId, (url) => {
    _currentUrl = url;
    const handlers = _eventListeners.get("navigate");
    if (handlers) {
      for (const h of handlers) {
        try { h(url); } catch (e) { logger.error(`[${name}] navigate handler error: ${e}`); }
      }
    }
  });

  const withErrScreen = async (fn, label) => {
    try { return await fn(); } catch (err) {
      const p = `./error-${name}-${Date.now()}.png`;
      try { await client.screenshot(p, tabId); logger.error(`[${name}] ${label} failed → ${p}`); }
      catch { logger.error(`[${name}] ${label} failed (no screenshot)`); }
      throw err;
    }
  };

  const site = {
    _name: name,
    _tabId: tabId,
    _pool: pool ?? null,

    poolStats: () => pool?.stats ?? null,

    navigate: (url, opts) => {
      const target = url ?? registeredUrl;
      return withTab(t =>
        retry(name, async () => {
          logger.network(`[${name}] navigating → ${target}`);
          await client.navigate(target, t);
          _currentUrl = target;
        }, opts?.retries ?? 2)
      );
    },

    reload: () => withTab(t => client.reload(t)),
    goBack: () => withTab(t => client.goBack(t)),
    goForward: () => withTab(t => client.goForward(t)),
    waitForNavigation: () => withTab(t => client.waitForNavigation(t)),

    title: () => withTab(async t => {
      const title = await client.getTitle(t);
      logger.info(`[${name}] title: ${title}`);
      return title;
    }),

    url: () => _currentUrl,
    content: () => withTab(t => client.content(t)),

    wait: (ms) => {
      const actual = humanMode ? ms + Math.floor(Math.random() * 600) - 300 : ms;
      return new Promise(r => setTimeout(r, Math.max(0, actual)));
    },

    waitForSelector: (selector, timeout = 30000) =>
      withTab(t => {
        logger.debug(`[${name}] waitForSelector: ${selector}`);
        return client.waitForSelector(selector, timeout, t);
      }),

    exposeFunction: (fnName, handler) =>
      exposeFunction(client, fnName, handler, tabId).then(() => site),

    unexposeFunction: (fnName) =>
      unexposeFunction(client, fnName, tabId).then(() => site),

    clearExposedFunctions: () =>
      clearExposedFunctions(client, tabId).then(() => site),

    exposeAndInject: (fnName, handler, injectionJs) =>
      exposeAndInject(client, fnName, handler, injectionJs, tabId).then(() => site),

    waitForVisible: (selector, timeout = 30000) =>
      withTab(t => client.waitForSelector(selector, timeout, t)),

    waitForResponse: (pattern, timeout = 30000) =>
      withTab(t => client.waitForResponse(pattern, timeout, t)),

    addInitScript: async (js) => {
      const code = typeof js === "function" ? `(${js.toString()})();` : js;
      await withTab(t => client.addInitScript(code, t));
      logger.success(`[${name}] init script added`);
      return site;
    },

    on: (event, handler) => {
      if (!_eventListeners.has(event)) _eventListeners.set(event, new Set());
      _eventListeners.get(event).add(handler);
      logger.debug(`[${name}] on('${event}') registered`);
      return () => {
        _eventListeners.get(event)?.delete(handler);
        logger.debug(`[${name}] on('${event}') unsubscribed`);
      };
    },

    off: (event, handler) => {
      _eventListeners.get(event)?.delete(handler);
    },

    click: (selector, opts) =>
      withErrScreen(() =>
        withTab(t =>
          retry(name, async () => {
            if (humanMode) await new Promise(r => setTimeout(r, 80 + Math.random() * 140));
            await client.waitForSelector(selector, opts?.timeout ?? 15000, t);
            const ok = await client.click(selector, t);
            if (!ok) throw new Error(`click failed: ${selector}`);
            logger.success(`[${name}] clicked: ${selector}`);
            return ok;
          }, opts?.retries ?? 2)
        ),
        `click(${selector})`
      ),

    doubleClick: (selector) =>
      withErrScreen(() =>
        withTab(async t => {
          if (humanMode) await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
          return client.doubleClick(selector, t);
        }),
        `dblclick(${selector})`
      ),

    hover: (selector) =>
      withErrScreen(() =>
        withTab(async t => {
          if (humanMode) await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
          return client.hover(selector, t);
        }),
        `hover(${selector})`
      ),

    type: (selector, text, opts) =>
      withErrScreen(() =>
        withTab(async t => {
          await client.waitForSelector(selector, 30000, t);

          if (humanMode) {
            const human = new HumanClient(client);
            await human.type({
              selector,
              text,
              clear: opts?.clear ?? false,
              speed: opts?.speed
            }, t);
          } else {
            if (opts?.clear) {
              await client.evaluate(`
                const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
                if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
              `, t);
            }
            await client.type(selector, text, t);
          }

          await client.evaluate(`
            document.querySelector('${selector.replace(/'/g, "\\'")}')?.dispatchEvent(new Event('blur', { bubbles: true }));
          `, t);

          logger.success(`[${name}] typed into: ${selector}`);
          return true;
        }),
        `type(${selector})`
      ),

    select: (selector, value) => withTab(t => client.select(selector, value, t)),

    evaluate: (js, ...args) => {
      const code = typeof js === "function"
        ? `(${js.toString()})(${args.map(a => JSON.stringify(a)).join(",")})`
        : js;
      return withTab(t => client.evaluate(code, t));
    },

    keyboard: {
      press: (key) => withTab(t => client.keyPress(key, t)),
      combo: (combo) => withTab(t => client.keyCombo(combo, t)),
    },

    mouse: {
      move: (x, y) => withTab(t => client.mouseMove(x, y, t)),
      drag: (from, to) => withTab(t => client.mouseDrag(from, to, t)),
    },

    scroll: {
      to: (selector) => withTab(t => client.scrollTo(selector, t)),
      by: (px) => withTab(async t => {
        if (humanMode) {
          const steps = Math.ceil(Math.abs(px) / 120);
          const chunk = px / steps;
          for (let i = 0; i < steps; i++) {
            await client.scrollBy(chunk, t);
            await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
          }
        } else {
          await client.scrollBy(px, t);
        }
      }),
    },

    fetchText: (selector) => withTab(t => client.fetchText(selector, t)),

    fetchLinks: async (selector) => {
      const links = await withTab(t => client.fetchLinks(selector, t));
      logger.info(`[${name}] fetchLinks(${selector}): ${links.length}`);
      return links;
    },

    fetchImages: async (selector) => {
      const imgs = await withTab(t => client.fetchImages(selector, t));
      logger.info(`[${name}] fetchImages(${selector}): ${imgs.length}`);
      return imgs;
    },

    search: {
      css: (query) => withTab(t => client.searchCss(query, t)),
      id: (query) => withTab(t => client.searchId(query, t)),
    },

    captcha: {
      status: () => withTab(t => createCaptchaAPI(client).status(t)),
      resolve: () => withTab(t => createCaptchaAPI(client).resolve(t)),
      pause: () => withTab(t => createCaptchaAPI(client).pause(t)),
      check: () => withTab(t => createCaptchaAPI(client).check(t)),
      autoRetry: (opts) => withTab(t => createCaptchaAPI(client).setAutoRetry(opts.enabled)),
      onCaptcha: (handler) => createCaptchaAPI(client).onCaptcha(tabId, handler),
      onResolved: (handler) => createCaptchaAPI(client).onCaptchaResolved(tabId, handler),
    },

    block: {
      status: () => withTab(t => createCaptchaAPI(client).blockStatus(t)),
      retry: () => withTab(t => createCaptchaAPI(client).blockRetry(t)),
      onBlocked: (handler) => createCaptchaAPI(client).onBlocked(tabId, handler),
      onRetry: (handler) => createCaptchaAPI(client).onBlockRetry(tabId, handler),
    },

    find: {
      css: (selector) => withTab(t => {
        console.log("[DEBUG] find.css tabId:", t);
        return createFindAPI(client).css(selector, t);
      }),
      all: (selector) => withTab(t => createFindAPI(client).all(selector, t)),
      first: (selector) => withTab(t => createFindAPI(client).first(selector, t)),
      byText: (text) => withTab(t => createFindAPI(client).byText(text, t)),
      byAttr: (attr, value) => withTab(t => createFindAPI(client).byAttr(attr, value, t)),
      byTag: (tag) => withTab(t => createFindAPI(client).byTag(tag, t)),
      byPlaceholder: (text) => withTab(t => createFindAPI(client).byPlaceholder(text, t)),
      byRole: (role, name) => withTab(t => createFindAPI(client).byRole(role, name, t)),
      children: (selector) => withTab(t => createFindAPI(client).children(selector, t)),
      parent: (selector) => withTab(t => createFindAPI(client).parent(selector, t)),
      closest: (selector, ancestor) => withTab(t => createFindAPI(client).closest(selector, ancestor, t)),
      count: (selector) => withTab(t => createFindAPI(client).count(selector, t)),
      exists: (selector) => withTab(t => createFindAPI(client).exists(selector, t)),
      visible: (selector) => withTab(t => createFindAPI(client).visible(selector, t)),
      enabled: (selector) => withTab(t => createFindAPI(client).enabled(selector, t)),
      checked: (selector) => withTab(t => createFindAPI(client).checked(selector, t)),
    },

    provide: {
      text: (opts) => withTab(t => createProvideAPI(client).text(opts, t)),
      textAll: (opts) => withTab(t => createProvideAPI(client).textAll(opts, t)),
      attr: (opts) => withTab(t => createProvideAPI(client).attr(opts, t)),
      attrAll: (opts) => withTab(t => createProvideAPI(client).attrAll(opts, t)),
      html: (opts) => withTab(t => createProvideAPI(client).html(opts, t)),
      table: (opts) => withTab(t => createProvideAPI(client).table(opts, t)),
      list: (opts) => withTab(t => createProvideAPI(client).list(opts, t)),
      links: (opts) => withTab(t => createProvideAPI(client).links(opts, t)),
      images: (opts) => withTab(t => createProvideAPI(client).images(opts, t)),
      form: (opts) => withTab(t => createProvideAPI(client).form(opts, t)),
      page: () => withTab(t => createProvideAPI(client).page(t)),
      div: (opts) => withTab(t => createProvideAPI(client).div(opts, t)),
      meta: () => withTab(t => createProvideAPI(client).meta(t)),
      select: (opts) => withTab(t => createProvideAPI(client).select(opts, t)),
      json: (opts) => withTab(t => createProvideAPI(client).json(opts, t)),
    },

    iframe: {
      list: () => withTab(t => createIframeAPI(client).list(t)),
      evaluate: (opts) => withTab(t => createIframeAPI(client).evaluate(opts, t)),
      click: (opts) => withTab(t => createIframeAPI(client).click(opts, t)),
      type: (opts) => withTab(t => createIframeAPI(client).type(opts, t)),
      text: (opts) => withTab(t => createIframeAPI(client).text(opts, t)),
      html: (opts) => withTab(t => createIframeAPI(client).html(opts, t)),
      waitSel: (opts) => withTab(t => createIframeAPI(client).waitSel(opts, t)),
    },

    screenshot: async (filePath) => {
      const r = await withTab(t => client.screenshot(filePath, t));
      logger.success(`[${name}] screenshot → ${filePath ?? "base64"}`);
      return r;
    },

    pdf: async (filePath) => {
      const r = await withTab(t => client.pdf(filePath, t));
      logger.success(`[${name}] pdf → ${filePath ?? "base64"}`);
      return r;
    },

    human: {
      set: (opts) => withTab(t => createHumanAPI(client).set(opts, t)),
      get: () => withTab(t => createHumanAPI(client).get(t)),
      type: (opts) => withTab(t => createHumanAPI(client).type(opts, t)),
      click: (opts) => withTab(t => createHumanAPI(client).click(opts, t)),
    },

    blockImages: () => withTab(async t => { await client.blockImages(t); logger.info(`[${name}] images blocked`); }),
    unblockImages: () => withTab(async t => { await client.unblockImages(t); logger.info(`[${name}] images unblocked`); }),

    cookies: {
      set: async (cookieName, value, domain, path = "/") => {
        await withTab(t => client.setCookie(cookieName, value, domain, path, t));
        logger.info(`[${name}] cookie set: ${cookieName} @ ${domain}`);
      },
      get: (cookieName, domain = "") => withTab(t => client.getCookie(cookieName, domain, t)),
      delete: async (cookieName, domain) => {
        const d = domain ?? new URL(registeredUrl).hostname;
        await withTab(t => client.deleteCookie(cookieName, d, t));
        logger.info(`[${name}] cookie deleted: ${cookieName}`);
      },
      list: (domain = "") => withTab(t => client.listCookies(domain, t)),
    },

    intercept: {
      block: async (pattern) => {
        await withTab(t => client.addInterceptRule("block", pattern, {}, t));
        logger.info(`[${name}] intercept block: ${pattern}`);
      },

      redirect: async (pattern, redirectUrl) => {
        await withTab(t => client.addInterceptRule("redirect", pattern, { redirectUrl }, t));
        logger.info(`[${name}] intercept redirect: ${pattern} → ${redirectUrl}`);
      },

      headers: async (pattern, headers) => {
        await withTab(t => client.addInterceptRule("modifyHeaders", pattern, { headers }, t));
        logger.info(`[${name}] intercept modifyHeaders: ${pattern}`);
      },

      respond: async (pattern, handlerOrResponse) => {
        const isStatic = typeof handlerOrResponse === "object";

        if (!isStatic) {
          const fnName = `__piggy_respond_${name}_${++_modifyRuleCounter}__`;
          await client.exposeFunction(fnName, async (req) => {
            try {
              const result = handlerOrResponse(req);
              return { success: true, result: { status: result.status ?? 200, contentType: result.contentType ?? "application/json", body: result.body ?? "" } };
            } catch (e) {
              return { success: false, error: e.message };
            }
          }, tabId);

          const dynamicScript = `
(function() {
  'use strict';
  if (!window.__PIGGY_DYNAMIC_RESPOND__) window.__PIGGY_DYNAMIC_RESPOND__ = [];
  window.__PIGGY_DYNAMIC_RESPOND__.push({ pattern: ${JSON.stringify(pattern)}, fn: ${JSON.stringify(fnName)} });
  function matchUrl(url, pattern) { try { return url.includes(pattern) || new RegExp(pattern).test(url); } catch { return url.includes(pattern); } }
  if (window.__PIGGY_DYN_INSTALLED__) return;
  window.__PIGGY_DYN_INSTALLED__ = true;
  const _origFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const rules = window.__PIGGY_DYNAMIC_RESPOND__ || [];
    for (const rule of rules) {
      if (matchUrl(url, rule.pattern) && typeof window[rule.fn] === 'function') {
        try { const r = await window[rule.fn]({ url, method }); return new Response(r.body ?? '', { status: r.status ?? 200, headers: { 'Content-Type': r.contentType ?? 'application/json' } }); } catch { break; }
      }
    }
    return _origFetch.apply(this, arguments);
  };
})();`;
          await withTab(async t => {
            await client.addInitScript(dynamicScript, t);
            await client.evaluate(dynamicScript, t);
          });
          logger.success(`[${name}] intercept.respond (dynamic): ${pattern}`);
          return site;
        }

        const response = handlerOrResponse;
        const script = buildRespondScript(pattern, response.status ?? 200, response.contentType ?? "application/json", response.body);
        await withTab(async t => {
          await client.addInitScript(script, t);
          await client.evaluate(script, t);
        });
        logger.success(`[${name}] intercept.respond (static): ${pattern} → ${response.status ?? 200}`);
        return site;
      },

      modifyResponse: async (pattern, handler) => {
        const fnName = `__piggy_modres_${name}_${++_modifyRuleCounter}__`;
        await client.exposeFunction(fnName, async (response) => {
          try { const mod = await handler(response); return { success: true, result: mod ?? {} }; }
          catch (e) { return { success: false, error: e.message }; }
        }, tabId);

        const script = buildModifyResponseScript(pattern, fnName);
        await withTab(async t => {
          await client.addInitScript(script, t);
          await client.evaluate(script, t);
        });
        logger.success(`[${name}] intercept.modifyResponse: ${pattern}`);
        return site;
      },

      clear: async () => {
        await withTab(t => client.clearInterceptRules(t));
        logger.info(`[${name}] intercept rules cleared`);
      },
    },

    dialog: {
      accept: (tabId = "default", text) => new DialogClient(client).accept(tabId, text),
      dismiss: (tabId = "default") => new DialogClient(client).dismiss(tabId),
      status: (tabId = "default") => new DialogClient(client).status(tabId),
      setAutoAction: (tabId = "default", action) => new DialogClient(client).setAutoAction(tabId, action),
      upload: (selector, filePath, tabId = "default") => new DialogClient(client).upload(selector, filePath, tabId),
      onDialog: (tabId, handler) => new DialogClient(client).onDialog(tabId, handler),
      waitAndAccept: (tabId = "default", text, timeoutMs = 30000) => new DialogClient(client).waitAndAccept(tabId, text, timeoutMs),
      waitAndDismiss: (tabId = "default", timeoutMs = 30000) => new DialogClient(client).waitAndDismiss(tabId, timeoutMs),
    },

    capture: {
      start: () => withTab(async t => { await client.captureStart(t); logger.info(`[${name}] capture started`); }),
      stop: () => withTab(async t => { await client.captureStop(t); logger.info(`[${name}] capture stopped`); }),
      requests: () => withTab(t => client.captureRequests(t)),
      ws: () => withTab(t => client.captureWs(t)),
      cookies: () => withTab(t => client.captureCookies(t)),
      storage: () => withTab(t => client.captureStorage(t)),
      clear: () => withTab(async t => { await client.captureClear(t); logger.info(`[${name}] capture cleared`); }),
    },

    session: {
      export: () => withTab(t => createSessionAPI(client).export(t)),
      import: (data) => withTab(t => createSessionAPI(client).import(data, t)),
      reload: () => withTab(t => createSessionAPI(client).reload(t)),
      paths: () => createSessionAPI(client).paths(),
      cookies: { path: () => createSessionAPI(client).cookiesPath() },
      profile: { path: () => createSessionAPI(client).profilePath() },
      ws: { save: (opts) => createSessionAPI(client).setWsSave(opts.enabled) },
      pings: { save: (opts) => createSessionAPI(client).setPingsSave(opts.enabled) },
    },

    store: async (data, schemaName) => {
      const target = schemaName ?? name;
      const result = await storeRecord(target, data);
      logger.info(`[${name}] store → stored: ${result.stored}, skipped: ${result.skipped}`);
      return result;
    },

    api: (path, handler, opts) => {
      const key = `${name}:${path}`;
      if (routeRegistry.has(key)) { logger.warn(`[${name}] route ${path} already registered`); return site; }
      routeRegistry.set(key, {
        path,
        method: opts?.method ?? "GET",
        handler,
        ttl: opts?.ttl ?? 360_000,
        before: opts?.before ?? [],
        detail: opts?.detail,
      });
      logger.info(`[${name}] api route: ${opts?.method ?? "GET"} /${name}${path}`);
      return site;
    },

    noclose: () => { keepAliveSites.add(name); logger.info(`[${name}] keep-alive`); return site; },

    close: async () => {
      _unsubNavigate();
      keepAliveSites.delete(name);
      if (pool) {
        await pool.close();
      } else if (tabId !== "default") {
        await client.closeTab(tabId);
        logger.info(`[${name}] tab closed`);
      }
    },
  };

  return site;
}

export function createExposedAPI(site, apiName, handlers) {
  const wrappedHandler = async (call) => {
    const { method, args } = call;
    const handler = handlers[method];
    if (!handler) throw new Error(`Unknown method: ${method}`);
    try { return await handler(args); }
    catch (err) { logger.error(`[${site._name}] API error in ${method}: ${err}`); throw err; }
  };
  return site.exposeFunction(apiName, wrappedHandler);
}