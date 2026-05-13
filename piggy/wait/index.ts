// piggy/wait/index.ts
import { PiggyClient } from "../client";

export type WaitSelectorState = "attached" | "detached" | "visible" | "hidden";

// ─── WaitClient ───────────────────────────────────────────────────────────────
// Maps to PiggyWait.cpp

export class WaitClient {
  constructor(private client: PiggyClient) {}

  // wait.function — poll every 100ms until JS expr is truthy
  function(js: string, timeout = 10000, tabId = "default"): Promise<void> {
    return this.client.send("wait.function", { js, timeout, tabId });
  }

  // wait.selector — with full state support (attached|detached|visible|hidden)
  selector(
    selector: string,
    state: WaitSelectorState = "attached",
    timeout = 10000,
    tabId = "default"
  ): Promise<void> {
    return this.client.send("wait.selector", { selector, state, timeout, tabId });
  }
}

// ─── EvaluateClient ───────────────────────────────────────────────────────────
// Maps to the evaluate command in PiggyWait.cpp (with timeout support)
// and PiggyInteractions.cpp (without timeout)

export class EvaluateClient {
  constructor(private client: PiggyClient) {}

  // evaluate with optional wall-clock timeout
  run(js: string, timeout?: number, tabId = "default"): Promise<unknown> {
    return this.client.send("evaluate", {
      js,
      tabId,
      ...(timeout !== undefined ? { timeout } : {}),
    });
  }
}

// ─── FetchClient ──────────────────────────────────────────────────────────────
// Maps to fetch.textAll / fetch.attr / fetch.attrAll in PiggyWait.cpp
// and fetch.text / fetch.links / fetch.image in PiggyExport.cpp

export class FetchClient {
  constructor(private client: PiggyClient) {}

  // fetch.text — single element innerText
  text(selector: string, tabId = "default"): Promise<string | null> {
    return this.client.send("fetch.text", { query: selector, tabId });
  }

  // fetch.textAll — all matching elements innerText
  textAll(selector: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.textAll", { selector, tabId });
  }

  // fetch.attr — single attribute from first match
  attr(selector: string, attr: string, tabId = "default"): Promise<string | null> {
    return this.client.send("fetch.attr", { selector, attr, tabId });
  }

  // fetch.attrAll — attribute from all matches
  attrAll(selector: string, attr: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.attrAll", { selector, attr, tabId });
  }

  // fetch.links — links inside a selector
  links(selector: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.links", { query: selector, tabId });
  }

  // fetch.links.all — all links on page
  linksAll(tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.links.all", { tabId });
  }

  // fetch.image — images inside a selector
  images(selector: string, tabId = "default"): Promise<string[]> {
    return this.client.send("fetch.image", { query: selector, tabId });
  }
}

export function createWaitAPI(client: PiggyClient):     WaitClient     { return new WaitClient(client); }
export function createEvaluateAPI(client: PiggyClient): EvaluateClient { return new EvaluateClient(client); }
export function createFetchAPI(client: PiggyClient):    FetchClient    { return new FetchClient(client); }
