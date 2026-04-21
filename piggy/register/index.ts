// piggy/register/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";
import { routeRegistry, keepAliveSites, type RouteHandler, type BeforeMiddleware } from "../server";
import { randomDelay, humanTypeSequence } from "../human";
import { buildRespondScript, buildModifyResponseScript } from "../intercept/scripts";

let globalClient: PiggyClient | null = null;
export let humanMode = false;

export function setClient(c: PiggyClient | null) { globalClient = c; }
export function setHumanMode(v: boolean) { humanMode = v; }

async function retry<T>(label: string, fn: () => Promise<T>, retries = 2, backoff = 150): Promise<T> {
  let last!: Error;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e: any) {
      last = e;
      if (i < retries) {
        logger.warn(`[${label}] retry ${i + 1}/${retries}: ${e.message}`);
        await new Promise(r => setTimeout(r, backoff * (i + 1)));
      }
    }
  }
  throw last;
}

export function createSiteObject(name: string, registeredUrl: string, client: PiggyClient, tabId: string) {
  let _currentUrl: string = registeredUrl;

  // ── Event listeners store ──────────────────────────────────────────────────
  const _eventListeners = new Map<string, Set<(data: any) => void>>();

  // Wire the client-level navigate event into site-level listeners
  const _unsubNavigate = client.onEvent("navigate", tabId, (url: string) => {
    _currentUrl = url;
    const handlers = _eventListeners.get("navigate");
    if (handlers) {
      for (const h of handlers) {
        try { h(url); } catch (e) { logger.error(`[${name}] navigate handler error: ${e}`); }
      }
    }
  });

  const withErrScreen = async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    try { return await fn(); } catch (err: any) {
      const p = `./error-${name}-${Date.now()}.png`;
      try { await client.screenshot(p, tabId); logger.error(`[${name}] ${label} failed → ${p}`); }
      catch { logger.error(`[${name}] ${label} failed (no screenshot)`); }
      throw err;
    }
  };

  // ── Intercept helper: unique fn name per pattern ───────────────────────────
  let _modifyRuleCounter = 0;

  const site: any = {
    _name: name,
    _tabId: tabId,

    // ── Navigation ─────────────────────────────────────────────────────────────
    navigate: (url?: string, opts?: { retries?: number }) => {
      const target = url ?? registeredUrl;
      return retry(name, async () => {
        logger.network(`[${name}] navigating → ${target}`);
        await client.navigate(target, tabId);
        _currentUrl = target;
      }, opts?.retries ?? 2);
    },

    reload:             () => client.reload(tabId),
    goBack:             () => client.goBack(tabId),
    goForward:          () => client.goForward(tabId),
    waitForNavigation:  () => client.waitForNavigation(tabId),

    title: async () => {
      const t = await client.getTitle(tabId);
      logger.info(`[${name}] title: ${t}`);
      return t;
    },
    url:     () => _currentUrl,
    content: () => client.content(tabId),

    wait: (ms: number) => {
      const actual = humanMode ? ms + Math.floor(Math.random() * 600) - 300 : ms;
      return new Promise<void>(r => setTimeout(r, Math.max(0, actual)));
    },

    waitForSelector: (selector: string, timeout = 30000) => {
      logger.debug(`[${name}] waitForSelector: ${selector}`);
      return client.waitForSelector(selector, timeout, tabId);
    },
    waitForVisible:  (selector: string, timeout = 30000) => client.waitForSelector(selector, timeout, tabId),
    waitForResponse: (pattern: string, timeout = 30000)  => client.waitForResponse(pattern, timeout, tabId),

    // ── Init Script ────────────────────────────────────────────────────────────
    addInitScript: async (js: string | (() => void)) => {
      const code = typeof js === 'function' ? `(${js.toString()})();` : js;
      await client.addInitScript(code, tabId);
      logger.success(`[${name}] init script added`);
      return site;
    },

    // ── Event emitter ──────────────────────────────────────────────────────────
    // Usage: site.on('navigate', url => console.log('went to', url))
    // Returns unsubscribe function
    on: (event: string, handler: (data: any) => void): (() => void) => {
      if (!_eventListeners.has(event)) _eventListeners.set(event, new Set());
      _eventListeners.get(event)!.add(handler);
      logger.debug(`[${name}] on('${event}') registered`);
      return () => {
        _eventListeners.get(event)?.delete(handler);
        logger.debug(`[${name}] on('${event}') unsubscribed`);
      };
    },

    off: (event: string, handler: (data: any) => void) => {
      _eventListeners.get(event)?.delete(handler);
    },

    // ── Interactions ───────────────────────────────────────────────────────────
    click: (selector: string, opts?: { retries?: number; timeout?: number }) =>
      withErrScreen(() =>
        retry(name, async () => {
          if (humanMode) await randomDelay(80, 220);
          await client.waitForSelector(selector, opts?.timeout ?? 15000, tabId);
          const ok = await client.click(selector, tabId);
          if (!ok) throw new Error(`click failed: ${selector}`);
          logger.success(`[${name}] clicked: ${selector}`);
          return ok;
        }, opts?.retries ?? 2),
        `click(${selector})`
      ),

    doubleClick: (selector: string) =>
      withErrScreen(async () => {
        if (humanMode) await randomDelay(80, 200);
        return client.doubleClick(selector, tabId);
      }, `dblclick(${selector})`),

    hover: (selector: string) =>
      withErrScreen(async () => {
        if (humanMode) await randomDelay(50, 150);
        return client.hover(selector, tabId);
      }, `hover(${selector})`),

    type: async (selector: string, text: string, opts?: { delay?: number; retries?: number; fact?: boolean; wpm?: number }) =>
      withErrScreen(async () => {
        await client.waitForSelector(selector, 15000, tabId);
        if (humanMode && !opts?.fact) {
          const seq = humanTypeSequence(text);
          let current = "";
          for (const action of seq) {
            if (action === "BACKSPACE") current = current.slice(0, -1);
            else current += action;
            await client.type(selector, current, tabId);
            const wpm = opts?.wpm ?? 120;
            const msPerChar = Math.round(60000 / (wpm * 5));
            await randomDelay(msPerChar * 0.5, msPerChar * 1.8);
          }
        } else if (opts?.delay) {
          for (const ch of text) {
            await client.type(selector, ch, tabId);
            await new Promise(r => setTimeout(r, opts.delay));
          }
        } else {
          await client.type(selector, text, tabId);
        }
        logger.success(`[${name}] typed into: ${selector}`);
        return true;
      }, `type(${selector})`),

    select:   (selector: string, value: string) => client.select(selector, value, tabId),
    evaluate: (js: string | (() => any), ...args: any[]) => {
      const code = typeof js === "function" ? `(${js.toString()})(${args.map(a => JSON.stringify(a)).join(",")})` : js;
      return client.evaluate(code, tabId);
    },

    keyboard: {
      press: (key: string)   => client.keyPress(key, tabId),
      combo: (combo: string) => client.keyCombo(combo, tabId),
    },

    mouse: {
      move: (x: number, y: number) => client.mouseMove(x, y, tabId),
      drag: (from: { x: number; y: number }, to: { x: number; y: number }) => client.mouseDrag(from, to, tabId),
    },

    scroll: {
      to: (selector: string) => client.scrollTo(selector, tabId),
      by: (px: number) => {
        if (humanMode) {
          const steps = Math.ceil(Math.abs(px) / 120);
          const chunk = px / steps;
          return (async () => {
            for (let i = 0; i < steps; i++) {
              await client.scrollBy(chunk, tabId);
              await randomDelay(30, 80);
            }
          })();
        }
        return client.scrollBy(px, tabId);
      },
    },

    // ── Fetch ──────────────────────────────────────────────────────────────────
    fetchText:   (selector: string) => client.fetchText(selector, tabId),
    fetchLinks:  async (selector: string) => {
      const links = await client.fetchLinks(selector, tabId);
      logger.info(`[${name}] fetchLinks(${selector}): ${links.length}`);
      return links;
    },
    fetchImages: async (selector: string) => {
      const imgs = await client.fetchImages(selector, tabId);
      logger.info(`[${name}] fetchImages(${selector}): ${imgs.length}`);
      return imgs;
    },

    search: {
      css: (query: string) => client.searchCss(query, tabId),
      id:  (query: string) => client.searchId(query, tabId),
    },

    // ── Screenshot / PDF ───────────────────────────────────────────────────────
    screenshot: async (filePath?: string) => {
      const r = await client.screenshot(filePath, tabId);
      logger.success(`[${name}] screenshot → ${filePath ?? "base64"}`);
      return r;
    },
    pdf: async (filePath?: string) => {
      const r = await client.pdf(filePath, tabId);
      logger.success(`[${name}] pdf → ${filePath ?? "base64"}`);
      return r;
    },

    blockImages:   async () => { await client.blockImages(tabId);   logger.info(`[${name}] images blocked`); },
    unblockImages: async () => { await client.unblockImages(tabId); logger.info(`[${name}] images unblocked`); },

    // ── Cookies ────────────────────────────────────────────────────────────────
    cookies: {
      set: async (cookieName: string, value: string, domain: string, path = "/") => {
        await client.setCookie(cookieName, value, domain, path, tabId);
        logger.info(`[${name}] cookie set: ${cookieName} @ ${domain}`);
      },
      get: (cookieName: string) => client.getCookie(cookieName, tabId),
      delete: async (cookieName: string) => {
        await client.deleteCookie(cookieName, tabId);
        logger.info(`[${name}] cookie deleted: ${cookieName}`);
      },
      list: () => client.listCookies(tabId),
    },

    // ── Interception ───────────────────────────────────────────────────────────
    intercept: {
      block: async (pattern: string) => {
        await client.addInterceptRule("block", pattern, {}, tabId);
        logger.info(`[${name}] intercept block: ${pattern}`);
      },

      redirect: async (pattern: string, redirectUrl: string) => {
        await client.addInterceptRule("redirect", pattern, { redirectUrl }, tabId);
        logger.info(`[${name}] intercept redirect: ${pattern} → ${redirectUrl}`);
      },

      headers: async (pattern: string, headers: Record<string, string>) => {
        await client.addInterceptRule("modifyHeaders", pattern, { headers }, tabId);
        logger.info(`[${name}] intercept modifyHeaders: ${pattern}`);
      },

      // ── NEW: intercept.respond ──────────────────────────────────────────────
      // Intercepts matching requests and returns a fake response — request never
      // leaves the browser. Works for both fetch and XHR via JS injection.
      //
      // Usage:
      //   await site.intercept.respond('/api/prices', (req) => ({
      //     status: 200,
      //     contentType: 'application/json',
      //     body: JSON.stringify({ price: 99 })
      //   }))
      //
      //   // Static shorthand:
      //   await site.intercept.respond('/api/prices', {
      //     status: 200, contentType: 'application/json', body: '{"price":99}'
      //   })
      respond: async (
        pattern: string,
        handlerOrResponse:
          | { status?: number; contentType?: string; body: string }
          | ((req: { url: string; method: string }) => { status?: number; contentType?: string; body: string })
      ) => {
        // Static response — just inject the JS rule directly
        const isStatic = typeof handlerOrResponse === "object";
        const response = isStatic
          ? handlerOrResponse
          : { status: 200, contentType: "application/json", body: "" };

        if (!isStatic) {
          // Dynamic: expose a function, call it from the injected script
          const fnName = `__piggy_respond_${name}_${++_modifyRuleCounter}__`;

          await client.exposeFunction(fnName, async (req: { url: string; method: string }) => {
            try {
              const result = (handlerOrResponse as Function)(req);
              return {
                success: true,
                result: {
                  status:      result.status      ?? 200,
                  contentType: result.contentType ?? "application/json",
                  body:        result.body        ?? "",
                }
              };
            } catch (e: any) {
              return { success: false, error: e.message };
            }
          }, tabId);

          // Inject a script that calls the exposed function instead of static body
          const dynamicScript = `
(function() {
  'use strict';
  if (!window.__PIGGY_DYNAMIC_RESPOND__) window.__PIGGY_DYNAMIC_RESPOND__ = [];
  window.__PIGGY_DYNAMIC_RESPOND__.push({ pattern: ${JSON.stringify(pattern)}, fn: ${JSON.stringify(fnName)} });

  function matchUrl(url, pattern) {
    try { return url.includes(pattern) || new RegExp(pattern).test(url); }
    catch { return url.includes(pattern); }
  }

  if (window.__PIGGY_DYN_INSTALLED__) return;
  window.__PIGGY_DYN_INSTALLED__ = true;

  const _origFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const rules = window.__PIGGY_DYNAMIC_RESPOND__ || [];
    for (const rule of rules) {
      if (matchUrl(url, rule.pattern) && typeof window[rule.fn] === 'function') {
        try {
          const r = await window[rule.fn]({ url, method });
          return new Response(r.body ?? '', {
            status: r.status ?? 200,
            headers: { 'Content-Type': r.contentType ?? 'application/json' }
          });
        } catch { break; }
      }
    }
    return _origFetch.apply(this, arguments);
  };
})();`;
          await client.addInitScript(dynamicScript, tabId);
          await client.evaluate(dynamicScript, tabId);
          logger.success(`[${name}] intercept.respond (dynamic): ${pattern}`);
          return site;
        }

        // Static path: inject the JS intercept rule
        const script = buildRespondScript(
          pattern,
          response.status      ?? 200,
          response.contentType ?? "application/json",
          response.body
        );
        await client.addInitScript(script, tabId);
        await client.evaluate(script, tabId);
        logger.success(`[${name}] intercept.respond (static): ${pattern} → ${response.status ?? 200}`);
        return site;
      },

      // ── NEW: intercept.modifyResponse ───────────────────────────────────────
      // Lets the request hit the network, then calls your handler with the
      // response. Return { body?, status?, headers? } to modify, or {} to
      // pass through unchanged.
      //
      // Usage:
      //   await site.intercept.modifyResponse('/api/feed', async ({ body, status }) => {
      //     const data = JSON.parse(body)
      //     data.items = data.items.slice(0, 5)
      //     return { body: JSON.stringify(data) }
      //   })
      modifyResponse: async (
        pattern: string,
        handler: (response: { body: string; status: number; headers: Record<string, string> }) =>
          Promise<{ body?: string; status?: number; headers?: Record<string, string> } | void> | void
      ) => {
        const fnName = `__piggy_modres_${name}_${++_modifyRuleCounter}__`;

        await client.exposeFunction(fnName, async (response: { body: string; status: number; headers: Record<string, string> }) => {
          try {
            const mod = await handler(response);
            return { success: true, result: mod ?? {} };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        }, tabId);

        const script = buildModifyResponseScript(pattern, fnName);
        await client.addInitScript(script, tabId);
        await client.evaluate(script, tabId);
        logger.success(`[${name}] intercept.modifyResponse: ${pattern}`);
        return site;
      },

      clear: async () => {
        await client.clearInterceptRules(tabId);
        logger.info(`[${name}] intercept rules cleared`);
      },
    },

    // ── Network capture ────────────────────────────────────────────────────────
    capture: {
      start: async () => { await client.captureStart(tabId); logger.info(`[${name}] capture started`); },
      stop:  async () => { await client.captureStop(tabId);  logger.info(`[${name}] capture stopped`); },
      requests: () => client.captureRequests(tabId),
      ws:       () => client.captureWs(tabId),
      cookies:  () => client.captureCookies(tabId),
      storage:  () => client.captureStorage(tabId),
      clear: async () => { await client.captureClear(tabId); logger.info(`[${name}] capture cleared`); },
    },

    // ── Session ────────────────────────────────────────────────────────────────
    session: {
      export: async () => { const data = await client.sessionExport(tabId); logger.success(`[${name}] session exported`); return data; },
      import: async (data: any) => { await client.sessionImport(data, tabId); logger.success(`[${name}] session imported`); },
    },

    // ── Expose Function ─────────────────────────────────────────────────────────
    exposeFunction: async (fnName: string, handler: (data: any) => Promise<any> | any) => {
      await client.exposeFunction(fnName, handler, tabId);
      logger.success(`[${name}] exposed function: ${fnName}`);
      return site;
    },
    unexposeFunction: async (fnName: string) => {
      await client.unexposeFunction(fnName, tabId);
      logger.info(`[${name}] unexposed function: ${fnName}`);
      return site;
    },
    clearExposedFunctions: async () => {
      await client.clearExposedFunctions(tabId);
      logger.info(`[${name}] cleared all exposed functions`);
      return site;
    },
    exposeAndInject: async (fnName: string, handler: (data: any) => Promise<any> | any, injectionJs: string | ((fnName: string) => string)) => {
      await client.exposeFunction(fnName, handler, tabId);
      const js = typeof injectionJs === "function" ? injectionJs(fnName) : injectionJs;
      await client.evaluate(js, tabId);
      logger.success(`[${name}] exposed and injected: ${fnName}`);
      return site;
    },

    // ── Elysia API ─────────────────────────────────────────────────────────────
    api: (path: string, handler: RouteHandler, opts?: { ttl?: number; before?: BeforeMiddleware[]; method?: "GET" | "POST" | "PUT" | "DELETE" }) => {
      const key = `${name}:${path}`;
      if (routeRegistry.has(key)) { logger.warn(`[${name}] route ${path} already registered`); return site; }
      routeRegistry.set(key, {
        path,
        method: opts?.method ?? "GET",
        handler,
        ttl: opts?.ttl ?? 360_000,
        before: opts?.before ?? [],
      });
      logger.info(`[${name}] api route: ${opts?.method ?? "GET"} /${name}${path}`);
      return site;
    },

    noclose: () => { keepAliveSites.add(name); logger.info(`[${name}] keep-alive`); return site; },

    close: async () => {
      _unsubNavigate(); // Clean up navigate listener
      keepAliveSites.delete(name);
      if (tabId !== "default") {
        await client.closeTab(tabId);
        logger.info(`[${name}] tab closed`);
      }
    },
  };

  return site;
}

export function createExposedAPI<T extends Record<string, (data: any) => any>>(site: any, apiName: string, handlers: T): Promise<void> {
  const wrappedHandler = async (call: any) => {
    const { method, args } = call;
    const handler = handlers[method as keyof T];
    if (!handler) throw new Error(`Unknown method: ${method}`);
    try { return await handler(args); }
    catch (err) { logger.error(`[${site._name}] API error in ${method}: ${err}`); throw err; }
  };
  return site.exposeFunction(apiName, wrappedHandler);
}