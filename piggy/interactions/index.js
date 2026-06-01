// piggy/interactions/index.js
import { PiggyClient } from "../client.js";

export class InteractionsClient {
  constructor(client) {
    this.client = client;
  }

  // ── Click ─────────────────────────────────────────────────────────────────

  click(selector, tabId = "default") {
    return this.client.send("click", { selector, tabId });
  }

  dblclick(selector, tabId = "default") {
    return this.client.send("dblclick", { selector, tabId });
  }

  hover(selector, tabId = "default") {
    return this.client.send("hover", { selector, tabId });
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  type(selector, text, tabId = "default") {
    return this.client.send("type", { selector, text, tabId });
  }

  typeClear(selector, text, tabId = "default") {
    return this.client.send("type", { selector, text, clear: true, tabId });
  }

  select(selector, value, tabId = "default") {
    return this.client.send("select", { selector, value, tabId });
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  scrollTo(selector, tabId = "default") {
    return this.client.send("scroll.to", { selector, tabId });
  }

  scrollBy(px, tabId = "default") {
    return this.client.send("scroll.by", { px, tabId });
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  keyPress(key, tabId = "default") {
    return this.client.send("keyboard.press", { key, tabId });
  }

  keyCombo(combo, tabId = "default") {
    return this.client.send("keyboard.combo", { combo, tabId });
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────

  mouseMove(x, y, tabId = "default") {
    return this.client.send("mouse.move", { x, y, tabId });
  }

  mouseDrag(from, to, tabId = "default") {
    return this.client.send("mouse.drag", { from, to, tabId });
  }

  // ── Evaluate ──────────────────────────────────────────────────────────────

  evaluate(js, tabId = "default") {
    return this.client.send("evaluate", { js, tabId });
  }
}

export function createInteractionsAPI(client) {
  return new InteractionsClient(client);
}