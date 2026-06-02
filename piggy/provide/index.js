// piggy/provide/index.js
import { PiggyClient } from "../client/index.js";

// ─── ProvideClient ────────────────────────────────────────────────────────────
// provide answers ONE question: "give me the actual value from this element."
// All methods take an options object { selector, parent? } so scoping is consistent.
// If you just want to know if something exists, use find instead.

export class ProvideClient {
  constructor(client) {
    this.client = client;
  }

  /** innerText of the first matched element. */
  text(opts, tabId = "default") {
    return this.client.send("provide.text", { ...opts, tabId });
  }

  /** innerText of all matched elements. */
  textAll(opts, tabId = "default") {
    return this.client.send("provide.textAll", { ...opts, tabId });
  }

  /** Single attribute value from the first matched element. */
  attr(opts, tabId = "default") {
    return this.client.send("provide.attr", { ...opts, tabId });
  }

  /** Attribute value from all matched elements. */
  attrAll(opts, tabId = "default") {
    return this.client.send("provide.attrAll", { ...opts, tabId });
  }

  /** innerHTML of the first matched element. */
  html(opts, tabId = "default") {
    return this.client.send("provide.html", { ...opts, tabId });
  }

  /** Extract a table into headers + rows. */
  table(opts, tabId = "default") {
    return this.client.send("provide.table", { ...opts, tabId });
  }

  /** Extract a list of text items, optionally scoped to child items. */
  list(opts, tabId = "default") {
    return this.client.send("provide.list", { ...opts, tabId });
  }

  /** All links inside the matched selector. */
  links(opts, tabId = "default") {
    return this.client.send("provide.links", { ...opts, tabId });
  }

  /** All images inside the matched selector. */
  images(opts, tabId = "default") {
    return this.client.send("provide.images", { ...opts, tabId });
  }

  /** Form field name→value map. */
  form(opts, tabId = "default") {
    return this.client.send("provide.form", { ...opts, tabId });
  }

  /** Full page info: title, url, html, text. No selector needed. */
  page(tabId = "default") {
    return this.client.send("provide.page", { tabId });
  }

  /** Structured div tree: tag, id, cls, text, html, children[]. */
  div(opts, tabId = "default") {
    return this.client.send("provide.div", { ...opts, tabId });
  }

  /** All <meta> name→content pairs. No selector needed. */
  meta(tabId = "default") {
    return this.client.send("provide.meta", { tabId });
  }

  /** <select> current value + all options. */
  select(opts, tabId = "default") {
    return this.client.send("provide.select", { ...opts, tabId });
  }

  /**
   * Parse JSON from element innerText or script[type=application/json].
   * selector is optional — defaults to the first matching JSON script tag.
   */
  json(opts, tabId = "default") {
    return this.client.send("provide.json", { ...opts, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createProvideAPI(client) {
  return new ProvideClient(client);
}