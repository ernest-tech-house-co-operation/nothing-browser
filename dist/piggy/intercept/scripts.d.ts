/**
 * Generates a script that short-circuits matching fetch/XHR requests
 * and returns a static fake response — the request never hits the network.
 */
export declare function buildRespondScript(pattern: string, status: number, contentType: string, body: string): string;
/**
 * Generates a script that lets the request hit the network, then calls
 * an exposed function with { body, status, headers }.
 * The exposed function returns { body?, status?, headers? } modifications
 * or an empty object {} to pass through unchanged.
 */
export declare function buildModifyResponseScript(pattern: string, exposedFnName: string): string;
//# sourceMappingURL=scripts.d.ts.map