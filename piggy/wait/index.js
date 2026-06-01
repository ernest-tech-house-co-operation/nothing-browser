'use strict';

// ─── WaitClient ───────────────────────────────────────────────────────────────

class WaitClient {
  constructor(client) {
    this.client = client;
  }

  function(js, timeout = 10000, tabId = "default") {
    return this.client.send("wait.function", { js, timeout, tabId });
  }

  selector(selector, state = "attached", timeout = 10000, tabId = "default") {
    return this.client.send("wait.selector", { selector, state, timeout, tabId });
  }
}

// ─── EvaluateClient ───────────────────────────────────────────────────────────

class EvaluateClient {
  constructor(client) {
    this.client = client;
  }

  run(js, timeout, tabId = "default") {
    return this.client.send("evaluate", {
      js,
      tabId,
      ...(timeout !== undefined ? { timeout } : {}),
    });
  }
}

// ─── FetchClient ──────────────────────────────────────────────────────────────

class FetchClient {
  constructor(client) {
    this.client = client;
  }

  text(selector, tabId = "default") {
    return this.client.send("fetch.text", { query: selector, tabId });
  }

  textAll(selector, tabId = "default") {
    return this.client.send("fetch.textAll", { selector, tabId });
  }

  attr(selector, attr, tabId = "default") {
    return this.client.send("fetch.attr", { selector, attr, tabId });
  }

  attrAll(selector, attr, tabId = "default") {
    return this.client.send("fetch.attrAll", { selector, attr, tabId });
  }

  links(selector, tabId = "default") {
    return this.client.send("fetch.links", { query: selector, tabId });
  }

  linksAll(tabId = "default") {
    return this.client.send("fetch.links.all", { tabId });
  }

  images(selector, tabId = "default") {
    return this.client.send("fetch.image", { query: selector, tabId });
  }
}

// ─── Factories ────────────────────────────────────────────────────────────────

function createWaitAPI(client)     { return new WaitClient(client);     }
function createEvaluateAPI(client) { return new EvaluateClient(client); }
function createFetchAPI(client)    { return new FetchClient(client);    }

module.exports = { WaitClient, EvaluateClient, FetchClient, createWaitAPI, createEvaluateAPI, createFetchAPI };