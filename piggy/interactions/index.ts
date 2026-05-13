// piggy/interactions/index.ts
import { PiggyClient } from "../client";

export interface MousePosition {
  x: number;
  y: number;
}

export class InteractionsClient {
  constructor(private client: PiggyClient) {}

  // ── Click ─────────────────────────────────────────────────────────────────

  click(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("click", { selector, tabId });
  }

  dblclick(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("dblclick", { selector, tabId });
  }

  hover(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("hover", { selector, tabId });
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  type(selector: string, text: string, tabId = "default"): Promise<boolean> {
    return this.client.send("type", { selector, text, tabId });
  }

  typeClear(selector: string, text: string, tabId = "default"): Promise<boolean> {
    return this.client.send("type", { selector, text, clear: true, tabId });
  }

  select(selector: string, value: string, tabId = "default"): Promise<boolean> {
    return this.client.send("select", { selector, value, tabId });
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  scrollTo(selector: string, tabId = "default"): Promise<boolean> {
    return this.client.send("scroll.to", { selector, tabId });
  }

  scrollBy(px: number, tabId = "default"): Promise<boolean> {
    return this.client.send("scroll.by", { px, tabId });
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  keyPress(key: string, tabId = "default"): Promise<boolean> {
    return this.client.send("keyboard.press", { key, tabId });
  }

  keyCombo(combo: string, tabId = "default"): Promise<boolean> {
    return this.client.send("keyboard.combo", { combo, tabId });
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────

  mouseMove(x: number, y: number, tabId = "default"): Promise<boolean> {
    return this.client.send("mouse.move", { x, y, tabId });
  }

  mouseDrag(from: MousePosition, to: MousePosition, tabId = "default"): Promise<boolean> {
    return this.client.send("mouse.drag", { from, to, tabId });
  }

  // ── Evaluate ──────────────────────────────────────────────────────────────

  evaluate(js: string, tabId = "default"): Promise<unknown> {
    return this.client.send("evaluate", { js, tabId });
  }
}

export function createInteractionsAPI(client: PiggyClient): InteractionsClient {
  return new InteractionsClient(client);
}
