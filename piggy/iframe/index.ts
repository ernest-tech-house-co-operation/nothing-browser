// piggy/iframe/index.ts
import { PiggyClient } from "../client";

// ─── Descriptor types ─────────────────────────────────────────────────────────

export interface IframeDescriptor {
  index: number;
  src:   string;
  id:    string;
  name:  string;
}

// ─── Option types ─────────────────────────────────────────────────────────────

/** Target an iframe by its index or src. One must be provided. */
export type IframeTarget =
  | { index: number; src?: never }
  | { src: string;  index?: never };

export type IframeEvaluateOptions = IframeTarget & { js: string };
export type IframeClickOptions    = IframeTarget & { sel: string };
export type IframeTypeOptions     = IframeTarget & { sel: string; text: string };
export type IframeTextOptions     = IframeTarget & { sel: string };
export type IframeHtmlOptions     = IframeTarget;
export type IframeWaitSelOptions  = IframeTarget & { sel: string; timeout?: number };

// ─── IframeClient ─────────────────────────────────────────────────────────────

export class IframeClient {
  constructor(private client: PiggyClient) {}

  /** List all iframes on the page: index, src, id, name. */
  list(tabId = "default"): Promise<IframeDescriptor[]> {
    return this.client.send("iframe.list", { tabId });
  }

  /** Run arbitrary JS inside the targeted iframe. Returns whatever the script returns. */
  evaluate(opts: IframeEvaluateOptions, tabId = "default"): Promise<unknown> {
    return this.client.send("iframe.evaluate", { ...opts, tabId });
  }

  /** Click a selector inside the targeted iframe. */
  click(opts: IframeClickOptions, tabId = "default"): Promise<boolean> {
    return this.client.send("iframe.click", { ...opts, tabId });
  }

  /** Type text into a selector inside the targeted iframe. */
  type(opts: IframeTypeOptions, tabId = "default"): Promise<boolean> {
    return this.client.send("iframe.type", { ...opts, tabId });
  }

  /** Get innerText of a selector inside the targeted iframe. */
  text(opts: IframeTextOptions, tabId = "default"): Promise<string> {
    return this.client.send("iframe.text", { ...opts, tabId });
  }

  /** Get the full HTML of the targeted iframe. */
  html(opts: IframeHtmlOptions, tabId = "default"): Promise<string> {
    return this.client.send("iframe.html", { ...opts, tabId });
  }

  /** Wait until a selector appears inside the targeted iframe. */
  waitSel(opts: IframeWaitSelOptions, tabId = "default"): Promise<boolean> {
    return this.client.send("iframe.waitSel", { ...opts, tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createIframeAPI(client: PiggyClient): IframeClient {
  return new IframeClient(client);
}
// Done. One thing worth noting — `IframeTarget` is a discriminated union so TypeScript enforces you pass either `index` or `src`, never both. Usage looks like:

// ```js
// piggy.google.iframe.list()
// piggy.google.iframe.click({ index: 0, sel: "#btn" })
// piggy.google.iframe.evaluate({ src: "https://...", js: "document.title" })
// ```