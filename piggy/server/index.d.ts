// piggy/server/index.d.ts
import { Elysia } from "elysia";

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

export declare const routeRegistry: Map<string, RouteConfig>;
export declare const keepAliveSites: Set<string>;

export declare function startServer(
  port: number,
  hostname?: string,
  openapiOpts?: {
    title?: string;
    version?: string;
    description?: string;
    path?: string;
  }
): Promise<Elysia>;

export declare function stopServer(): void;