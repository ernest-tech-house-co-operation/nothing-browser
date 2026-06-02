// piggy/find/index.js
import { PiggyClient } from "../client/index.js";

// ─── FindClient ───────────────────────────────────────────────────────────────
// find answers ONE question: "is this thing here, and where?"
// All methods take plain selector strings — no option objects, no parent scoping.
// If you need a value out of an element, use provide instead.

export class FindClient {
  constructor(client) {
    this.client = client;
  }

  // ── Multi-result ──────────────────────────────────────────────────────────

  /** querySelectorAll — returns all matching elements. */
  css(selector, tabId = "default") {
    return this.client.send("find.css", { selector, tabId });
  }

  /** Alias for css(). */
  all(selector, tabId = "default") {
    return this.client.send("find.all", { selector, tabId });
  }

  /** querySelector — returns a single-element array or []. */
  first(selector, tabId = "default") {
    return this.client.send("find.first", { selector, tabId });
  }

  /** Find elements whose innerText contains the given text. */
  byText(text, tabId = "default") {
    return this.client.send("find.byText", { text, tabId });
  }

  /** Find elements by attribute name (and optional value). */
  byAttr(attr, value, tabId = "default") {
    return this.client.send("find.byAttr", { attr, value, tabId });
  }

  /** getElementsByTagName. */
  byTag(tag, tabId = "default") {
    return this.client.send("find.byTag", { tag, tabId });
  }

  /** Find inputs/textareas whose placeholder contains the given text. */
  byPlaceholder(text, tabId = "default") {
    return this.client.send("find.byPlaceholder", { text, tabId });
  }

  /** Find elements by ARIA role, optionally filtered by accessible name. */
  byRole(role, name, tabId = "default") {
    return this.client.send("find.byRole", { role, name, tabId });
  }

  /** Direct children of the matched element. */
  children(selector, tabId = "default") {
    return this.client.send("find.children", { selector, tabId });
  }

  /** parentElement of the matched element. */
  parent(selector, tabId = "default") {
    return this.client.send("find.parent", { selector, tabId });
  }

  /** Walk up the DOM from selector until ancestor matches. */
  closest(selector, ancestor, tabId = "default") {
    return this.client.send("find.closest", { selector, ancestor, tabId });
  }

  // ── Boolean / numeric ─────────────────────────────────────────────────────

  /** Number of elements matching the selector. */
  count(selector, tabId = "default") {
    return this.client.send("find.count", { selector, tabId });
  }

  /** True if at least one element matches. */
  exists(selector, tabId = "default") {
    return this.client.send("find.exists", { selector, tabId });
  }

  /** True if the first matched element is visible. */
  visible(selector, tabId = "default") {
    return this.client.send("find.visible", { selector, tabId });
  }

  /** True if the first matched element is not disabled. */
  enabled(selector, tabId = "default") {
    return this.client.send("find.enabled", { selector, tabId });
  }

  /** True if the first matched checkbox/radio is checked. */
  checked(selector, tabId = "default") {
    return this.client.send("find.checked", { selector, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createFindAPI(client) {
  return new FindClient(client);
}