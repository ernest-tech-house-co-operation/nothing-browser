// piggy/server/index.ts
import { Elysia } from "elysia";
import * as cache from "../cache/memory";
import logger from "../logger";

export type BeforeMiddleware = (ctx: {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
  set: any;
}) => void | Promise<void>;

export type RouteHandler = (
  params: Record<string, string>,
  query: Record<string, string>,
  body: any
) => Promise<any>;

export interface RouteConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  handler: RouteHandler;
  ttl: number;
  before: BeforeMiddleware[];
}

export const routeRegistry = new Map<string, RouteConfig>();
export const keepAliveSites = new Set<string>();

// ── Error mapper ──────────────────────────────────────────────────────────────

function mapError(err: Error, site: string) {
  const msg = err.message.toLowerCase();
  if (msg.includes("selector") || msg.includes("not found") || msg.includes("null"))
    return { status: 404, error: "Not found", site, details: err.message };
  if (msg.includes("timeout") || msg.includes("timed out"))
    return { status: 504, error: "Timeout", site, details: err.message };
  if (msg.includes("socket") || msg.includes("closed") || msg.includes("browser"))
    return { status: 503, error: "Browser unavailable", site, details: err.message };
  return { status: 500, error: "Internal server error", site, details: err.message };
}

// ── Server factory ────────────────────────────────────────────────────────────

let _app: Elysia | null = null;

export async function startServer(port: number, hostname = "0.0.0.0"): Promise<Elysia> {
  _app = new Elysia();

  // ── Health route ────────────────────────────────────────────────────────────
  _app.get("/health", () => ({
    status: "ok",
    routes: routeRegistry.size,
    cacheEntries: cache.size(),
    uptime: process.uptime(),
  }));

  // ── Cache management routes ─────────────────────────────────────────────────
  _app.delete("/cache", () => {
    cache.clear();
    return { cleared: true };
  });

  _app.get("/cache/keys", () => ({ keys: cache.keys() }));

  // ── Registered site routes ──────────────────────────────────────────────────
  for (const [registryKey, config] of routeRegistry.entries()) {
    // registryKey format is "siteName:path" e.g. "movie:/title"
    const colonIdx = registryKey.indexOf(":");
    const siteName = registryKey.substring(0, colonIdx);
    const fullPath = `/${siteName}${config.path}`;
    const method = config.method.toLowerCase() as "get" | "post" | "put" | "delete";

    logger.info(`[server] mounting ${config.method} ${fullPath} (ttl=${config.ttl}ms)`);

    const routeHandler = async ({ params, query, body, headers, set }: any) => {
      // 1. Run before middleware
      for (const mw of config.before) {
        try {
          await mw({ params, query, body, headers, set });
        } catch (e: any) {
          set.status = set.status ?? 400;
          return { error: e.message };
        }
      }

      // 2. Cache check
      const cacheKey = `${siteName}:${fullPath}:${JSON.stringify({ params, query })}`;
      const hit = cache.get(cacheKey);
      if (hit !== null) {
        set.headers["x-cache"] = "HIT";
        set.headers["x-cache-key"] = cacheKey;
        return hit;
      }

      // 3. Execute handler
      let result: any;
      try {
        result = await config.handler(params, query, body);
      } catch (e: any) {
        const mapped = mapError(e, siteName);
        set.status = mapped.status;
        return mapped;
      }

      // 4. Store in cache
      if (config.ttl > 0) {
        cache.set(cacheKey, result, config.ttl);
        set.headers["x-cache"] = "MISS";
      }

      return result;
    };

    if (method === "get")         _app.get(fullPath, routeHandler);
    else if (method === "post")   _app.post(fullPath, routeHandler);
    else if (method === "put")    _app.put(fullPath, routeHandler);
    else if (method === "delete") _app.delete(fullPath, routeHandler);
  }

  _app.listen({ port, hostname });

  logger.success(`🚀 Piggy API server → http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`);
  logger.info(`   Routes mounted: ${routeRegistry.size}`);
  routeRegistry.forEach((cfg, key) => {
    const siteName = key.substring(0, key.indexOf(":"));
    logger.info(`   ${cfg.method} /${siteName}${cfg.path}  (ttl=${cfg.ttl}ms)`);
  });

  return _app;
}

export function stopServer() {
  _app?.stop();
  _app = null;
}