import { Elysia } from "elysia";
export type BeforeMiddleware = (ctx: {
    params: Record<string, string>;
    query: Record<string, string>;
    body: any;
    headers: Record<string, string>;
    set: any;
}) => void | Promise<void>;
export type RouteHandler = (params: Record<string, string>, query: Record<string, string>, body: any) => Promise<any>;
export interface RouteConfig {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: RouteHandler;
    ttl: number;
    before: BeforeMiddleware[];
}
export declare const routeRegistry: Map<string, RouteConfig>;
export declare const keepAliveSites: Set<string>;
export declare function startServer(port: number, hostname?: string): Promise<Elysia>;
export declare function stopServer(): void;
//# sourceMappingURL=index.d.ts.map