// piggy/register/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";
import { routeRegistry, keepAliveSites, type RouteHandler, type BeforeMiddleware } from "../server";
import { randomDelay, humanTypeSequence } from "../human";

let globalClient: PiggyClient | null = null;
export let humanMode = false;

export function setClient(c: PiggyClient | null) { globalClient = c; }
export function setHumanMode(v: boolean) { humanMode = v; }

async function retry<T>(
  label: string,
  fn: () => Promise<T>,
  retries = 2,
  backoff = 150
): Promise<T> {
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
  tabId: string
) {
  let _currentUrl: string = registeredUrl;

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
      set: async (name: string, value: string, domain: string, path = "/") => {
        await client.setCookie(name, value, domain, path, tabId);
        logger.info(`[${name}] cookie set: ${name} @ ${domain}`);
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
      clear: async () => {
        await client.clearInterceptRules(tabId);
        logger.info(`[${name}] intercept rules cleared`);
      },
    },

    // ── Network capture ────────────────────────────────────────────────────────

    capture: {
      start: async () => {
        await client.captureStart(tabId);
        logger.info(`[${name}] capture started`);
      },
      stop: async () => {
        await client.captureStop(tabId);
        logger.info(`[${name}] capture stopped`);
      },
      requests: () => client.captureRequests(tabId),
      ws:       () => client.captureWs(tabId),
      cookies:  () => client.captureCookies(tabId),
      storage:  () => client.captureStorage(tabId),
      clear: async () => {
        await client.captureClear(tabId);
        logger.info(`[${name}] capture cleared`);
      },
    },

    // ── Session ────────────────────────────────────────────────────────────────

    session: {
      export: async () => {
        const data = await client.sessionExport(tabId);
        logger.success(`[${name}] session exported`);
        return data;
      },
      import: async (data: any) => {
        await client.sessionImport(data, tabId);
        logger.success(`[${name}] session imported`);
      },
    },

    // ── Elysia API ─────────────────────────────────────────────────────────────

    api: (
      path: string,
      handler: RouteHandler,
      opts?: { ttl?: number; before?: BeforeMiddleware[]; method?: "GET" | "POST" | "PUT" | "DELETE" }
    ) => {
      const key = `${name}:${path}`;
      if (routeRegistry.has(key)) {
        logger.warn(`[${name}] route ${path} already registered`);
        return site;
      }
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
      keepAliveSites.delete(name);
      if (tabId !== "default") {
        await client.closeTab(tabId);
        logger.info(`[${name}] tab closed`);
      }
    },
  };

  return site;
}