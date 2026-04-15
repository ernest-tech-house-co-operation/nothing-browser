// piggy/intercept/scripts.ts
// JS injection helpers for intercept.respond and intercept.modifyResponse.
// Both work purely in the browser's JS layer — no C++ changes needed.

/**
 * Generates a script that short-circuits matching fetch/XHR requests
 * and returns a static fake response — the request never hits the network.
 */
export function buildRespondScript(
  pattern: string,
  status: number,
  contentType: string,
  body: string
): string {
  const safePattern     = pattern.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const safeBody        = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const safeContentType = contentType.replace(/'/g, "\\'");

  return `
(function() {
  'use strict';
  if (!window.__PIGGY_RESPOND_RULES__) window.__PIGGY_RESPOND_RULES__ = [];
  window.__PIGGY_RESPOND_RULES__.push({
    pattern: '${safePattern}',
    status: ${status},
    contentType: '${safeContentType}',
    body: \`${safeBody}\`
  });

  function _piggyMatchUrl(url, pattern) {
    try { return url.includes(pattern) || new RegExp(pattern).test(url); }
    catch { return url.includes(pattern); }
  }

  // Only install wrappers once per page
  if (window.__PIGGY_RESPOND_INSTALLED__) return;
  window.__PIGGY_RESPOND_INSTALLED__ = true;

  // ── fetch wrapper ──────────────────────────────────────────────────────────
  const _origFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input));
    const rules = window.__PIGGY_RESPOND_RULES__ || [];
    for (const rule of rules) {
      if (_piggyMatchUrl(url, rule.pattern)) {
        return Promise.resolve(new Response(rule.body, {
          status: rule.status,
          headers: { 'Content-Type': rule.contentType }
        }));
      }
    }
    return _origFetch.apply(this, arguments);
  };

  // ── XHR wrapper ────────────────────────────────────────────────────────────
  const _origOpen = XMLHttpRequest.prototype.open;
  const _origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this.__piggy_url__ = String(url);
    return _origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    const url = this.__piggy_url__ || '';
    const rules = window.__PIGGY_RESPOND_RULES__ || [];
    for (const rule of rules) {
      if (_piggyMatchUrl(url, rule.pattern)) {
        const self = this;
        Object.defineProperty(self, 'readyState',   { get: () => 4,            configurable: true });
        Object.defineProperty(self, 'status',       { get: () => rule.status,  configurable: true });
        Object.defineProperty(self, 'responseText', { get: () => rule.body,    configurable: true });
        Object.defineProperty(self, 'response',     { get: () => rule.body,    configurable: true });
        setTimeout(() => {
          if (typeof self.onreadystatechange === 'function') self.onreadystatechange();
          self.dispatchEvent(new Event('readystatechange'));
          self.dispatchEvent(new Event('load'));
          self.dispatchEvent(new Event('loadend'));
        }, 0);
        return;
      }
    }
    return _origSend.apply(this, arguments);
  };
})();
`;
}

/**
 * Generates a script that lets the request hit the network, then calls
 * an exposed function with { body, status, headers }.
 * The exposed function returns { body?, status?, headers? } modifications
 * or an empty object {} to pass through unchanged.
 */
export function buildModifyResponseScript(pattern: string, exposedFnName: string): string {
  const safePattern = pattern.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const safeFnName  = exposedFnName.replace(/'/g, "\\'");

  return `
(function() {
  'use strict';
  if (!window.__PIGGY_MODIFY_RULES__) window.__PIGGY_MODIFY_RULES__ = [];
  window.__PIGGY_MODIFY_RULES__.push({ pattern: '${safePattern}', fn: '${safeFnName}' });

  function _piggyMatchUrl(url, pattern) {
    try { return url.includes(pattern) || new RegExp(pattern).test(url); }
    catch { return url.includes(pattern); }
  }

  // Only install wrappers once per page
  if (window.__PIGGY_MODIFY_INSTALLED__) return;
  window.__PIGGY_MODIFY_INSTALLED__ = true;

  const _origFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url ?? String(input));
    const rules = window.__PIGGY_MODIFY_RULES__ || [];

    let matchedFn = null;
    for (const rule of rules) {
      if (_piggyMatchUrl(url, rule.pattern)) { matchedFn = rule.fn; break; }
    }

    // No match — pass through untouched
    const resp = await _origFetch.apply(this, arguments);
    if (!matchedFn) return resp;

    try {
      const bodyText = await resp.clone().text();
      const headers  = {};
      resp.headers.forEach((v, k) => { headers[k] = v; });

      const handlerFn = window[matchedFn];
      if (typeof handlerFn !== 'function') return resp;

      // Call Node.js handler via exposeFunction bridge
      const mod = await handlerFn({ body: bodyText, status: resp.status, headers });
      if (!mod || typeof mod !== 'object' || Object.keys(mod).length === 0) return resp;

      return new Response(
        mod.body    !== undefined ? mod.body    : bodyText,
        {
          status:  mod.status  !== undefined ? mod.status  : resp.status,
          headers: mod.headers !== undefined ? mod.headers : headers,
        }
      );
    } catch {
      return resp; // On any error, pass through original response
    }
  };
})();
`;
}