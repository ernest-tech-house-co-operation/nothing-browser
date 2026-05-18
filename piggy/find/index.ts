// piggy/find/index.ts
import { PiggyClient } from "../client";

// ─── Element descriptor ───────────────────────────────────────────────────────
// Mirrors __nb_serialize() in PiggyFind.cpp

export interface ElementDescriptor {
  tag:   string;
  id:    string;
  cls:   string;
  /** First 400 chars of innerText */
  text:  string;
  /** First 800 chars of innerHTML */
  html:  string;
  href:  string;
  src:   string;
  value: string;
  attrs: Record<string, string>;
}

// ─── FindClient ───────────────────────────────────────────────────────────────
// find answers ONE question: "is this thing here, and where?"
// All methods take plain selector strings — no option objects, no parent scoping.
// If you need a value out of an element, use provide instead.

export class FindClient {
  constructor(private client: PiggyClient) {}

  // ── Multi-result ─────────────────────────────────────────────────────────────

  /** querySelectorAll — returns all matching elements. */
  css(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.css", { selector, tabId });
  }

  /** Alias for css(). */
  all(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.all", { selector, tabId });
  }

  /** querySelector — returns a single-element array or []. */
  first(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.first", { selector, tabId });
  }

  /** Find elements whose innerText contains the given text. */
  byText(text: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byText", { text, tabId });
  }

  /** Find elements by attribute name (and optional value). */
  byAttr(attr: string, value?: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byAttr", { attr, value, tabId });
  }

  /** getElementsByTagName. */
  byTag(tag: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byTag", { tag, tabId });
  }

  /** Find inputs/textareas whose placeholder contains the given text. */
  byPlaceholder(text: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byPlaceholder", { text, tabId });
  }

  /** Find elements by ARIA role, optionally filtered by accessible name. */
  byRole(role: string, name?: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byRole", { role, name, tabId });
  }

  /** Direct children of the matched element. */
  children(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.children", { selector, tabId });
  }

  /** parentElement of the matched element. */
  parent(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.parent", { selector, tabId });
  }

  /** Walk up the DOM from selector until ancestor matches. */
  closest(selector: string, ancestor: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.closest", { selector, ancestor, tabId });
  }

  // ── Boolean / numeric ────────────────────────────────────────────────────────

  /** Number of elements matching the selector. */
  count(selector: string, tabId = "default"): Promise<number> {
    return this.client.send("find.count", { selector, tabId });
  }

  /** True if at least one element matches. */
  exists(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("find.exists", { selector, tabId });
  }

  /** True if the first matched element is visible. */
  visible(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("find.visible", { selector, tabId });
  }

  /** True if the first matched element is not disabled. */
  enabled(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("find.enabled", { selector, tabId });
  }

  /** True if the first matched checkbox/radio is checked. */
  checked(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("find.checked", { selector, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createFindAPI(client: PiggyClient): FindClient {
  return new FindClient(client);
}