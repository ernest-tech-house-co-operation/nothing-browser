// piggy/wait/index.ts
import { PiggyClient } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaitSelectorState = "attached" | "detached" | "visible" | "hidden";

// ─── WaitClient ───────────────────────────────────────────────────────────────

export class WaitClient {
  constructor(private client: PiggyClient) {}

  /**
   * Poll every 100ms until the JS expression returns truthy.
   * timeout defaults to 10000ms.
   */
  function(js: string, timeout?: number, tabId = "default"): Promise<void> {
    return this.client.send("wait.function", { js, timeout, tabId });
  }

  /**
   * Wait for a selector to reach a given state.
   * state defaults to "attached".
   */
  selector(selector: string, state?: WaitSelectorState, timeout?: number, tabId = "default"): Promise<void> {
    return this.client.send("wait.selector", { selector, state, timeout, tabId });
  }
}

// ─── EvaluateClient ───────────────────────────────────────────────────────────

export class EvaluateClient {
  constructor(private client: PiggyClient) {}

  /**
   * Run JS with an optional wall-clock timeout.
   * Returns whatever the script returns, or { ok: false, error: "timeout" }.
   */
  run(js: string, timeout?: number, tabId = "default"): Promise<unknown> {
    return this.client.send("evaluate", { js, timeout, tabId });
  }
}

// ─── FetchClient ──────────────────────────────────────────────────────────────

export class FetchClient {
  constructor(private client: PiggyClient) {}

  /** innerText of all matched elements. */
  textAll(selector: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.textAll", { selector, tabId });
  }

  /** Single attribute value from the first matched element. */
  attr(selector: string, attr: string, tabId = "default"): Promise<string> {
    return this.client.send("fetch.attr", { selector, attr, tabId });
  }

  /** Attribute value from all matched elements. */
  attrAll(selector: string, attr: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.attrAll", { selector, attr, tabId });
  }
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

export function createWaitAPI(client: PiggyClient):     WaitClient     { return new WaitClient(client); }
export function createEvaluateAPI(client: PiggyClient): EvaluateClient { return new EvaluateClient(client); }
export function createFetchAPI(client: PiggyClient):    FetchClient    { return new FetchClient(client); }