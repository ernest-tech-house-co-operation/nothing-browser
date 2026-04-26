// piggy/server/index.ts
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
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

export interface RouteParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema?: Record<string, any>;
}

export interface RouteDetail {
  tags?: string[];
  summary?: string;
  description?: string;
  deprecated?: boolean;
  hide?: boolean;
  parameters?: RouteParameter[];
}

export interface RouteConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  handler: RouteHandler;
  ttl: number;
  before: BeforeMiddleware[];
  detail?: RouteDetail;
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

export async function startServer(
  port: number,
  hostname = "0.0.0.0",
  openapiOpts?: {
    title?: string;
    version?: string;
    description?: string;
    path?: string;
  }
): Promise<Elysia> {
  _app = new Elysia();

  // ── OpenAPI ───────────────────────────────────────────────────────────────
  _app.use(
    openapi({
      path: openapiOpts?.path ?? "/openapi",
      documentation: {
        info: {
          title:       openapiOpts?.title       ?? "Piggy API",
          version:     openapiOpts?.version     ?? "1.0.0",
          description: openapiOpts?.description ?? "Auto-generated docs for all registered piggy routes",
        },
      },
    })
  );

  // ── Health ────────────────────────────────────────────────────────────────
  _app.get("/health", () => ({
    status: "ok",
    routes: routeRegistry.size,
    cacheEntries: cache.size(),
    uptime: process.uptime(),
  }), {
    detail: { tags: ["_piggy"], summary: "Health check" },
  });

  // ── Cache ─────────────────────────────────────────────────────────────────
  _app.delete("/cache", () => {
    cache.clear();
    return { cleared: true };
  }, {
    detail: { tags: ["_piggy"], summary: "Clear all cache entries" },
  });

  _app.get("/cache/keys", () => ({ keys: cache.keys() }), {
    detail: { tags: ["_piggy"], summary: "List all cache keys" },
  });

  // ── Registered site routes ────────────────────────────────────────────────
  for (const [registryKey, config] of routeRegistry.entries()) {
    const colonIdx = registryKey.indexOf(":");
    const siteName = registryKey.substring(0, colonIdx);
    const fullPath = `/${siteName}${config.path}`;
    const method = config.method.toLowerCase() as "get" | "post" | "put" | "delete";

    logger.info(`[server] mounting ${config.method} ${fullPath} (ttl=${config.ttl}ms)`);

    const routeHandler = async ({ params, query, body, headers, set }: any) => {
      for (const mw of config.before) {
        try {
          await mw({ params, query, body, headers, set });
        } catch (e: any) {
          set.status = set.status ?? 400;
          return { error: e.message };
        }
      }

      const cacheKey = `${siteName}:${fullPath}:${JSON.stringify({ params, query })}`;
      const hit = cache.get(cacheKey);
      if (hit !== null) {
        set.headers["x-cache"] = "HIT";
        set.headers["x-cache-key"] = cacheKey;
        return hit;
      }

      let result: any;
      try {
        result = await config.handler(params, query, body);
      } catch (e: any) {
        const mapped = mapError(e, siteName);
        set.status = mapped.status;
        return mapped;
      }

      if (config.ttl > 0) {
        cache.set(cacheKey, result, config.ttl);
        set.headers["x-cache"] = "MISS";
      }

      return result;
    };

    const routeDetail = {
      tags:        config.detail?.tags        ?? [siteName],
      summary:     config.detail?.summary     ?? `${config.method} ${fullPath}`,
      description: config.detail?.description,
      deprecated:  config.detail?.deprecated  ?? false,
      hide:        config.detail?.hide        ?? false,
      parameters:  config.detail?.parameters  ?? [],
    };

    if (method === "get")         _app.get(fullPath, routeHandler,    { detail: routeDetail });
    else if (method === "post")   _app.post(fullPath, routeHandler,   { detail: routeDetail });
    else if (method === "put")    _app.put(fullPath, routeHandler,    { detail: routeDetail });
    else if (method === "delete") _app.delete(fullPath, routeHandler, { detail: routeDetail });
  }

  _app.listen({ port, hostname });

  logger.success(`🚀 Piggy API server → http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`);
  logger.success(`📖 OpenAPI docs     → http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}/openapi`);
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