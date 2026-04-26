// piggy/register/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";
import { routeRegistry, keepAliveSites, type RouteHandler, type BeforeMiddleware, type RouteDetail } from "../server";
import { randomDelay, humanTypeSequence } from "../human";
import { buildRespondScript, buildModifyResponseScript } from "../intercept/scripts";
import { storeRecord } from "../store";
import { TabPool } from "../pool";

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

export function createSiteObject(
  name: string,
  registeredUrl: string,
  client: PiggyClient,
  tabId: string,
  pool?: TabPool
) {
  let _currentUrl: string = registeredUrl;
  let _modifyRuleCounter = 0;

  // ── helpers ────────────────────────────────────────────────────────────────
  // If pool exists, run fn with a pool tab. Otherwise use the fixed tabId.
  function withTab<T>(fn: (t: string) => Promise<T>): Promise<T> {
    return pool ? pool.withTab(fn) : fn(tabId);
  }

  const _eventListeners = new Map<string, Set<(data: any) => void>>();

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

  const site: any = {
    _name: name,
    _tabId: tabId,
    _pool: pool ?? null,

    // ── Pool stats ────────────────────────────────────────────────────────────
    poolStats: () => pool?.stats ?? null,

    // ── Navigation ────────────────────────────────────────────────────────────
    navigate: (url?: string, opts?: { retries?: number }) => {
      const target = url ?? registeredUrl;
      return withTab(t =>
        retry(name, async () => {
          logger.network(`[${name}] navigating → ${target}`);
          await client.navigate(target, t);
          _currentUrl = target;
        }, opts?.retries ?? 2)
      );
    },

    reload:            () => withTab(t => client.reload(t)),
    goBack:            () => withTab(t => client.goBack(t)),
    goForward:         () => withTab(t => client.goForward(t)),
    waitForNavigation: () => withTab(t => client.waitForNavigation(t)),

    title: () => withTab(async t => {
      const title = await client.getTitle(t);
      logger.info(`[${name}] title: ${title}`);
      return title;
    }),

    url:     () => _currentUrl,
    content: () => withTab(t => client.content(t)),

    wait: (ms: number) => {
      const actual = humanMode ? ms + Math.floor(Math.random() * 600) - 300 : ms;
      return new Promise<void>(r => setTimeout(r, Math.max(0, actual)));
    },

    waitForSelector: (selector: string, timeout = 30000) =>
      withTab(t => {
        logger.debug(`[${name}] waitForSelector: ${selector}`);
        return client.waitForSelector(selector, timeout, t);
      }),

    waitForVisible:  (selector: string, timeout = 30000) =>
      withTab(t => client.waitForSelector(selector, timeout, t)),

    waitForResponse: (pattern: string, timeout = 30000) =>
      withTab(t => client.waitForResponse(pattern, timeout, t)),

    // ── Init Script ───────────────────────────────────────────────────────────
    addInitScript: async (js: string | (() => void)) => {
      const code = typeof js === "function" ? `(${js.toString()})();` : js;
      await withTab(t => client.addInitScript(code, t));
      logger.success(`[${name}] init script added`);
      return site;
    },

    // ── Events ────────────────────────────────────────────────────────────────
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

    // ── Interactions ──────────────────────────────────────────────────────────
    click: (selector: string, opts?: { retries?: number; timeout?: number }) =>
      withErrScreen(() =>
        withTab(t =>
          retry(name, async () => {
            if (humanMode) await randomDelay(80, 220);
            await client.waitForSelector(selector, opts?.timeout ?? 15000, t);
            const ok = await client.click(selector, t);
            if (!ok) throw new Error(`click failed: ${selector}`);
            logger.success(`[${name}] clicked: ${selector}`);
            return ok;
          }, opts?.retries ?? 2)
        ),
        `click(${selector})`
      ),

    doubleClick: (selector: string) =>
      withErrScreen(() =>
        withTab(async t => {
          if (humanMode) await randomDelay(80, 200);
          return client.doubleClick(selector, t);
        }),
        `dblclick(${selector})`
      ),

    hover: (selector: string) =>
      withErrScreen(() =>
        withTab(async t => {
          if (humanMode) await randomDelay(50, 150);
          return client.hover(selector, t);
        }),
        `hover(${selector})`
      ),

    type: (selector: string, text: string, opts?: { delay?: number; retries?: number; fact?: boolean; wpm?: number }) =>
      withErrScreen(() =>
        withTab(async t => {
          await client.waitForSelector(selector, 15000, t);
          if (humanMode && !opts?.fact) {
            const seq = humanTypeSequence(text);
            let current = "";
            for (const action of seq) {
              if (action === "BACKSPACE") current = current.slice(0, -1);
              else current += action;
              await client.type(selector, current, t);
              const wpm = opts?.wpm ?? 120;
              const msPerChar = Math.round(60000 / (wpm * 5));
              await randomDelay(msPerChar * 0.5, msPerChar * 1.8);
            }
          } else if (opts?.delay) {
            for (const ch of text) {
              await client.type(selector, ch, t);
              await new Promise(r => setTimeout(r, opts.delay));
            }
          } else {
            await client.type(selector, text, t);
          }
          logger.success(`[${name}] typed into: ${selector}`);
          return true;
        }),
        `type(${selector})`
      ),

    select:   (selector: string, value: string) => withTab(t => client.select(selector, value, t)),

    evaluate: (js: string | (() => any), ...args: any[]) => {
      const code = typeof js === "function"
        ? `(${js.toString()})(${args.map(a => JSON.stringify(a)).join(",")})`
        : js;
      return withTab(t => client.evaluate(code, t));
    },

    keyboard: {
      press: (key: string)   => withTab(t => client.keyPress(key, t)),
      combo: (combo: string) => withTab(t => client.keyCombo(combo, t)),
    },

    mouse: {
      move: (x: number, y: number) => withTab(t => client.mouseMove(x, y, t)),
      drag: (from: { x: number; y: number }, to: { x: number; y: number }) =>
        withTab(t => client.mouseDrag(from, to, t)),
    },

    scroll: {
      to: (selector: string) => withTab(t => client.scrollTo(selector, t)),
      by: (px: number) => withTab(async t => {
          if (humanMode) {
            const steps = Math.ceil(Math.abs(px) / 120);
            const chunk = px / steps;
            for (let i = 0; i < steps; i++) {
              await client.scrollBy(chunk, t);
              await randomDelay(30, 80);
            }
          } else {
            await client.scrollBy(px, t);
          }
        }) as Promise<void>,
    },

    // ── Fetch ─────────────────────────────────────────────────────────────────
    fetchText:   (selector: string) => withTab(t => client.fetchText(selector, t)),

    fetchLinks: async (selector: string) => {
      const links = await withTab(t => client.fetchLinks(selector, t));
      logger.info(`[${name}] fetchLinks(${selector}): ${links.length}`);
      return links;
    },

    fetchImages: async (selector: string) => {
      const imgs = await withTab(t => client.fetchImages(selector, t));
      logger.info(`[${name}] fetchImages(${selector}): ${imgs.length}`);
      return imgs;
    },

    search: {
      css: (query: string) => withTab(t => client.searchCss(query, t)),
      id:  (query: string) => withTab(t => client.searchId(query, t)),
    },

    // ── Screenshot / PDF ──────────────────────────────────────────────────────
    screenshot: async (filePath?: string) => {
      const r = await withTab(t => client.screenshot(filePath, t));
      logger.success(`[${name}] screenshot → ${filePath ?? "base64"}`);
      return r;
    },

    pdf: async (filePath?: string) => {
      const r = await withTab(t => client.pdf(filePath, t));
      logger.success(`[${name}] pdf → ${filePath ?? "base64"}`);
      return r;
    },

    blockImages:   () => withTab(async t => { await client.blockImages(t);   logger.info(`[${name}] images blocked`); }),
    unblockImages: () => withTab(async t => { await client.unblockImages(t); logger.info(`[${name}] images unblocked`); }),

    // ── Cookies ───────────────────────────────────────────────────────────────
    cookies: {
      set: async (cookieName: string, value: string, domain: string, path = "/") => {
        await withTab(t => client.setCookie(cookieName, value, domain, path, t));
        logger.info(`[${name}] cookie set: ${cookieName} @ ${domain}`);
      },
      get:    (cookieName: string) => withTab(t => client.getCookie(cookieName, t)),
      delete: async (cookieName: string) => {
        await withTab(t => client.deleteCookie(cookieName, t));
        logger.info(`[${name}] cookie deleted: ${cookieName}`);
      },
      list: () => withTab(t => client.listCookies(t)),
    },

    // ── Interception ──────────────────────────────────────────────────────────
    intercept: {
      block: async (pattern: string) => {
        await withTab(t => client.addInterceptRule("block", pattern, {}, t));
        logger.info(`[${name}] intercept block: ${pattern}`);
      },

      redirect: async (pattern: string, redirectUrl: string) => {
        await withTab(t => client.addInterceptRule("redirect", pattern, { redirectUrl }, t));
        logger.info(`[${name}] intercept redirect: ${pattern} → ${redirectUrl}`);
      },

      headers: async (pattern: string, headers: Record<string, string>) => {
        await withTab(t => client.addInterceptRule("modifyHeaders", pattern, { headers }, t));
        logger.info(`[${name}] intercept modifyHeaders: ${pattern}`);
      },

      respond: async (
        pattern: string,
        handlerOrResponse:
          | { status?: number; contentType?: string; body: string }
          | ((req: { url: string; method: string }) => { status?: number; contentType?: string; body: string })
      ) => {
        const isStatic = typeof handlerOrResponse === "object";

        if (!isStatic) {
          const fnName = `__piggy_respond_${name}_${++_modifyRuleCounter}__`;
          await client.exposeFunction(fnName, async (req: { url: string; method: string }) => {
            try {
              const result = (handlerOrResponse as Function)(req);
              return { success: true, result: { status: result.status ?? 200, contentType: result.contentType ?? "application/json", body: result.body ?? "" } };
            } catch (e: any) {
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

      modifyResponse: async (
        pattern: string,
        handler: (response: { body: string; status: number; headers: Record<string, string> }) =>
          Promise<{ body?: string; status?: number; headers?: Record<string, string> } | void> | void
      ) => {
        const fnName = `__piggy_modres_${name}_${++_modifyRuleCounter}__`;
        await client.exposeFunction(fnName, async (response: any) => {
          try { const mod = await handler(response); return { success: true, result: mod ?? {} }; }
          catch (e: any) { return { success: false, error: e.message }; }
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

    // ── Network capture ───────────────────────────────────────────────────────
    capture: {
      start:    () => withTab(async t => { await client.captureStart(t);  logger.info(`[${name}] capture started`); }),
      stop:     () => withTab(async t => { await client.captureStop(t);   logger.info(`[${name}] capture stopped`); }),
      requests: () => withTab(t => client.captureRequests(t)),
      ws:       () => withTab(t => client.captureWs(t)),
      cookies:  () => withTab(t => client.captureCookies(t)),
      storage:  () => withTab(t => client.captureStorage(t)),
      clear:    () => withTab(async t => { await client.captureClear(t);  logger.info(`[${name}] capture cleared`); }),
    },

    // ── Session ───────────────────────────────────────────────────────────────
    session: {
      export: async () => {
        const data = await withTab(t => client.sessionExport(t));
        logger.success(`[${name}] session exported`);
        return data;
      },
      import: async (data: any) => {
        await withTab(t => client.sessionImport(data, t));
        logger.success(`[${name}] session imported`);
      },
    },

    // ── Expose Function ───────────────────────────────────────────────────────
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
      await withTab(t => client.evaluate(js, t));
      logger.success(`[${name}] exposed and injected: ${fnName}`);
      return site;
    },

    // ── Store ─────────────────────────────────────────────────────────────────
    store: async (
      data: Record<string, any> | Record<string, any>[],
      schemaName?: string
    ) => {
      const target = schemaName ?? name;
      const result = await storeRecord(target, data);
      logger.info(`[${name}] store → stored: ${result.stored}, skipped: ${result.skipped}`);
      return result;
    },

    // ── Elysia API ────────────────────────────────────────────────────────────
    api: (
      path: string,
      handler: RouteHandler,
      opts?: {
        ttl?: number;
        before?: BeforeMiddleware[];
        method?: "GET" | "POST" | "PUT" | "DELETE";
        detail?: RouteDetail;
      }
    ) => {
      const key = `${name}:${path}`;
      if (routeRegistry.has(key)) { logger.warn(`[${name}] route ${path} already registered`); return site; }
      routeRegistry.set(key, {
        path,
        method:  opts?.method ?? "GET",
        handler,
        ttl:     opts?.ttl ?? 360_000,
        before:  opts?.before ?? [],
        detail:  opts?.detail,
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

export type SiteObject = ReturnType<typeof createSiteObject>;

export function createExposedAPI<T extends Record<string, (data: any) => any>>(
  site: any,
  apiName: string,
  handlers: T
): Promise<void> {
  const wrappedHandler = async (call: any) => {
    const { method, args } = call;
    const handler = handlers[method as keyof T];
    if (!handler) throw new Error(`Unknown method: ${method}`);
    try { return await handler(args); }
    catch (err) { logger.error(`[${site._name}] API error in ${method}: ${err}`); throw err; }
  };
  return site.exposeFunction(apiName, wrappedHandler);
}