// piggy/find/index.ts
import { PiggyClient } from "../client";

// ─── Element descriptor ───────────────────────────────────────────────────────
// Mirrors __nb_serialize() in PiggyFind.cpp

export interface ElementDescriptor {
  tag: string;
  id: string;
  cls: string;
  /** First 400 chars of innerText */
  text: string;
  /** First 800 chars of innerHTML */
  html: string;
  href: string;
  src: string;
  value: string;
  attrs: Record<string, string>;
}

// ─── Option types ─────────────────────────────────────────────────────────────

export interface FindByTextOptions {
  text: string;
  /** Narrow the search to descendants of this CSS selector. */
  selector?: string;
  /** If true, innerText must match exactly (trimmed). Default: false. */
  exact?: boolean;
}

export interface FindByAttrOptions {
  attr: string;
  /** If omitted, matches any element that has the attribute at all. */
  value?: string;
  /** Optionally scope to a parent selector. */
  selector?: string;
}

export interface FindByRoleOptions {
  role: string;
  /** Filter by aria-label or innerText containing this string. */
  name?: string;
}

export interface FindClosestOptions {
  /** CSS selector for the starting element. */
  selector: string;
  /** CSS selector for the ancestor to climb to. */
  ancestor: string;
}

export interface FindFilterOptions {
  selector: string;
  attr: string;
  value: string;
}

// ─── FindClient ───────────────────────────────────────────────────────────────

export class FindClient {
  constructor(private client: PiggyClient) {}

  // ── Multi-result queries ─────────────────────────────────────────────────────

  /** querySelectorAll — returns all matching elements. */
  css(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.css", { selector, tabId });
  }

  /** Alias for css() — querySelectorAll. */
  all(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.all", { selector, tabId });
  }

  /** querySelector — returns a single-element array or []. */
  first(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.first", { selector, tabId });
  }

  /** Find elements whose innerText contains (or exactly matches) the given text. */
  byText(opts: FindByTextOptions, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byText", { ...opts, tabId });
  }

  /** Find elements by attribute name and optional value. */
  byAttr(opts: FindByAttrOptions, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byAttr", { ...opts, tabId });
  }

  /** getElementsByTagName. */
  byTag(tag: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byTag", { tag, tabId });
  }

  /** Find inputs/textareas whose placeholder contains the given text. */
  byPlaceholder(text: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byPlaceholder", { text, tabId });
  }

  /** Find elements by ARIA role, optionally filtered by aria-label / innerText. */
  byRole(opts: FindByRoleOptions, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.byRole", { ...opts, tabId });
  }

  /** Direct children of the matched element. */
  children(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.children", { selector, tabId });
  }

  /**
   * Filter querySelectorAll results by attribute value substring.
   * Equivalent to: querySelectorAll(selector).filter(el => el.attr.includes(value))
   */
  filter(opts: FindFilterOptions, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.filter", { ...opts, tabId });
  }

  // ── Single-element traversal ──────────────────────────────────────────────

  /** Walk up the DOM from selector until ancestor matches. */
  closest(opts: FindClosestOptions, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.closest", { ...opts, tabId });
  }

  /** parentElement of the matched element. */
  parent(selector: string, tabId = "default"): Promise<ElementDescriptor[]> {
    return this.client.send("find.parent", { selector, tabId });
  }

  // ── Boolean / numeric queries ─────────────────────────────────────────────

  /** Number of elements matching the selector. */
  count(selector: string, tabId = "default"): Promise<number> {
    return this.client.send("find.count", { selector, tabId });
  }

  /** True if at least one element matches the selector. */
  exists(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("find.exists", { selector, tabId });
  }

  /**
   * True if the first matched element is visible
   * (display !== none, visibility !== hidden, opacity !== 0).
   */
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

// ── Factory helper ────────────────────────────────────────────────────────────

export function createFindAPI(client: PiggyClient): FindClient {
  return new FindClient(client);
}