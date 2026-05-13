// piggy/provide/index.ts
import { PiggyClient } from "../client";

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

export class ProvideClient {
  constructor(private client: PiggyClient) {}

  /** innerText of the first matched element. */
  text(selector: string, tabId = "default"): Promise<string> {
    return this.client.send("provide.text", { selector, tabId });
  }

  /** innerText of all matched elements. */
  textAll(selector: string, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.textAll", { selector, tabId });
  }

  /** Single attribute value from the first matched element. */
  attr(selector: string, attr: string, tabId = "default"): Promise<string> {
    return this.client.send("provide.attr", { selector, attr, tabId });
  }

  /** Attribute value from all matched elements. */
  attrAll(selector: string, attr: string, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.attrAll", { selector, attr, tabId });
  }

  /** innerHTML of the first matched element. */
  html(selector: string, tabId = "default"): Promise<string> {
    return this.client.send("provide.html", { selector, tabId });
  }

  /** Extract a table into headers + rows. */
  table(selector: string, tabId = "default"): Promise<ProvideTable> {
    return this.client.send("provide.table", { selector, tabId });
  }

  /** Extract a list of text items. Optionally scope items with itemSel. */
  list(selector: string, itemSel?: string, tabId = "default"): Promise<string[]> {
    return this.client.send("provide.list", { selector, itemSel, tabId });
  }

  /** All links inside an optional selector. */
  links(selector?: string, tabId = "default"): Promise<ProvideLink[]> {
    return this.client.send("provide.links", { selector, tabId });
  }

  /** All images inside an optional selector. */
  images(selector?: string, tabId = "default"): Promise<ProvideImage[]> {
    return this.client.send("provide.images", { selector, tabId });
  }

  /** Form field name→value map. */
  form(selector: string, tabId = "default"): Promise<ProvideForm> {
    return this.client.send("provide.form", { selector, tabId });
  }

  /** Full page info: title, url, html, text. */
  page(tabId = "default"): Promise<ProvidePage> {
    return this.client.send("provide.page", { tabId });
  }

  /** Structured div: tag, id, cls, text, html, children[]. */
  div(selector: string, tabId = "default"): Promise<ProvideDiv> {
    return this.client.send("provide.div", { selector, tabId });
  }

  /** All <meta> name→content pairs. */
  meta(tabId = "default"): Promise<ProvideMeta> {
    return this.client.send("provide.meta", { tabId });
  }

  /** <select> current value + all options. */
  select(selector: string, tabId = "default"): Promise<ProvideSelect> {
    return this.client.send("provide.select", { selector, tabId });
  }

  /**
   * Parse JSON from element innerText or script[type=application/json].
   * selector is optional — defaults to the first matching JSON script tag.
   */
  json(selector?: string, tabId = "default"): Promise<unknown> {
    return this.client.send("provide.json", { selector, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createProvideAPI(client: PiggyClient): ProvideClient {
  return new ProvideClient(client);
}