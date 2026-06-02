// piggy/iframe/index.js
import { PiggyClient } from "../client/index.js";

// ─── IframeClient ─────────────────────────────────────────────────────────────

export class IframeClient {
  constructor(client) {
    this.client = client;
  }

  /** List all iframes on the page: index, src, id, name. */
  list(tabId = "default") {
    return this.client.send("iframe.list", { tabId });
  }

  /** Run arbitrary JS inside the targeted iframe. Returns whatever the script returns. */
  evaluate(opts, tabId = "default") {
    return this.client.send("iframe.evaluate", { ...opts, tabId });
  }

  /** Click a selector inside the targeted iframe. */
  click(opts, tabId = "default") {
    return this.client.send("iframe.click", { ...opts, tabId });
  }

  /** Type text into a selector inside the targeted iframe. */
  type(opts, tabId = "default") {
    return this.client.send("iframe.type", { ...opts, tabId });
  }

  /** Get innerText of a selector inside the targeted iframe. */
  text(opts, tabId = "default") {
    return this.client.send("iframe.text", { ...opts, tabId });
  }

  /** Get the full HTML of the targeted iframe. */
  html(opts, tabId = "default") {
    return this.client.send("iframe.html", { ...opts, tabId });
  }

  /** Wait until a selector appears inside the targeted iframe. */
  waitSel(opts, tabId = "default") {
    return this.client.send("iframe.waitSel", { ...opts, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createIframeAPI(client) {
  return new IframeClient(client);
}

// Usage:
// piggy.google.iframe.list()
// piggy.google.iframe.click({ index: 0, sel: "#btn" })
// piggy.google.iframe.evaluate({ src: "https://...", js: "document.title" })