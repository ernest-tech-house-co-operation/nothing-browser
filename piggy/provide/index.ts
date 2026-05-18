// piggy/provide/index.ts
import { PiggyClient } from "../client";

// ─── Shared base option ───────────────────────────────────────────────────────
// Every provide method targets a selector, and optionally scopes under a parent.

export interface ProvideOptions {
  /** CSS selector for the target element(s). */
  selector: string;
  /**
   * Optional parent selector to scope the query under.
   * Equivalent to: parent.querySelector(selector)
   */
  parent?: string;
}

export interface ProvideAttrOptions extends ProvideOptions {
  /** The attribute name to extract. */
  attr: string;
}

export interface ProvideListOptions extends ProvideOptions {
  /** Optional child selector to scope list items. */
  itemSel?: string;
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface ProvideTable {
  headers: string[];
  rows:    string[][];
}

export interface ProvideLink {
  text: string;
  href: string;
}

export interface ProvideImage {
  alt: string;
  src: string;
}

export interface ProvideForm {
  [name: string]: string;
}

export interface ProvidePage {
  title: string;
  url:   string;
  html:  string;
  text:  string;
}

export interface ProvideDiv {
  tag:      string;
  id:       string;
  cls:      string;
  text:     string;
  html:     string;
  children: ProvideDiv[];
}

export interface ProvideMeta {
  [name: string]: string;
}

export interface ProvideSelectOption {
  text:     string;
  value:    string;
  selected: boolean;
}

export interface ProvideSelect {
  value:   string;
  options: ProvideSelectOption[];
}

// ─── ProvideClient ────────────────────────────────────────────────────────────
// provide answers ONE question: "give me the actual value from this element."
// All methods take an options object { selector, parent? } so scoping is consistent.
// If you just want to know if something exists, use find instead.

export class ProvideClient {
  constructor(private client: PiggyClient) {}

  /** innerText of the first matched element. */
  text(opts: ProvideOptions, tabId = "default"): Promise<string> {
    return this.client.send("provide.text", { ...opts, tabId });
  }

  /** innerText of all matched elements. */
  textAll(opts: ProvideOptions, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.textAll", { ...opts, tabId });
  }

  /** Single attribute value from the first matched element. */
  attr(opts: ProvideAttrOptions, tabId = "default"): Promise<string> {
    return this.client.send("provide.attr", { ...opts, tabId });
  }

  /** Attribute value from all matched elements. */
  attrAll(opts: ProvideAttrOptions, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.attrAll", { ...opts, tabId });
  }

  /** innerHTML of the first matched element. */
  html(opts: ProvideOptions, tabId = "default"): Promise<string> {
    return this.client.send("provide.html", { ...opts, tabId });
  }

  /** Extract a table into headers + rows. */
  table(opts: ProvideOptions, tabId = "default"): Promise<ProvideTable> {
    return this.client.send("provide.table", { ...opts, tabId });
  }

  /** Extract a list of text items, optionally scoped to child items. */
  list(opts: ProvideListOptions, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.list", { ...opts, tabId });
  }

  /** All links inside the matched selector. */
  links(opts: ProvideOptions, tabId = "default"): Promise<ProvideLink[]> {
    return this.client.send("provide.links", { ...opts, tabId });
  }

  /** All images inside the matched selector. */
  images(opts: ProvideOptions, tabId = "default"): Promise<ProvideImage[]> {
    return this.client.send("provide.images", { ...opts, tabId });
  }

  /** Form field name→value map. */
  form(opts: ProvideOptions, tabId = "default"): Promise<ProvideForm> {
    return this.client.send("provide.form", { ...opts, tabId });
  }

  /** Full page info: title, url, html, text. No selector needed. */
  page(tabId = "default"): Promise<ProvidePage> {
    return this.client.send("provide.page", { tabId });
  }

  /** Structured div tree: tag, id, cls, text, html, children[]. */
  div(opts: ProvideOptions, tabId = "default"): Promise<ProvideDiv> {
    return this.client.send("provide.div", { ...opts, tabId });
  }

  /** All <meta> name→content pairs. No selector needed. */
  meta(tabId = "default"): Promise<ProvideMeta> {
    return this.client.send("provide.meta", { tabId });
  }

  /** <select> current value + all options. */
  select(opts: ProvideOptions, tabId = "default"): Promise<ProvideSelect> {
    return this.client.send("provide.select", { ...opts, tabId });
  }

  /**
   * Parse JSON from element innerText or script[type=application/json].
   * selector is optional — defaults to the first matching JSON script tag.
   */
  json(opts?: Partial<ProvideOptions>, tabId = "default"): Promise<unknown> {
    return this.client.send("provide.json", { ...opts, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createProvideAPI(client: PiggyClient): ProvideClient {
  return new ProvideClient(client);
}