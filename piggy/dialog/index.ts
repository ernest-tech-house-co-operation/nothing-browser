// piggy/dialog/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";

export interface DialogState {
  pending: boolean;
  type: string;         // "alert" | "confirm" | "prompt" | "beforeunload"
  message: string;
  defaultValue: string;
}

export class DialogClient {
  constructor(private client: PiggyClient) {}

  // ── Commands ──────────────────────────────────────────────────────────────

  accept(tabId = "default", text?: string): Promise<void> {
    return this.client.send("dialog.accept", { tabId, ...(text !== undefined ? { text } : {}) });
  }

  dismiss(tabId = "default"): Promise<void> {
    return this.client.send("dialog.dismiss", { tabId });
  }

  status(tabId = "default"): Promise<DialogState> {
    return this.client.send("dialog.status", { tabId });
  }

  /**
   * Pre-configure auto-handling for dialogs before they appear.
   * action: "accept" | "dismiss" | "" (emit event and wait for manual handling)
   */
  setAutoAction(tabId = "default", action: "accept" | "dismiss" | ""): Promise<void> {
    return this.client.send("dialog.onDialog", { tabId, action });
  }

  // ── File upload ───────────────────────────────────────────────────────────

  /**
   * Set a file input element to a local file path.
   * Uses DataTransfer + base64 injection — no native file picker needed.
   */
  upload(selector: string, filePath: string, tabId = "default"): Promise<void> {
    return this.client.send("upload", { selector, path: filePath, tabId });
  }

  // ── Event subscription ────────────────────────────────────────────────────

  onDialog(
    tabId: string,
    handler: (data: {
      dialogType: string;
      message: string;
      defaultValue: string;
      tabId: string;
    }) => void
  ): () => void {
    return this.client.onEvent("dialog", tabId, handler);
  }

  // ── Convenience: wait for a dialog then handle it ─────────────────────────

  waitAndAccept(tabId = "default", text?: string, timeoutMs = 30_000): Promise<DialogState> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`dialog.waitAndAccept: timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = this.onDialog(tabId, async (data) => {
        clearTimeout(timer);
        unsub();
        await this.accept(tabId, text);
        resolve(data as DialogState);
      });
    });
  }

  waitAndDismiss(tabId = "default", timeoutMs = 30_000): Promise<DialogState> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`dialog.waitAndDismiss: timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = this.onDialog(tabId, async (data) => {
        clearTimeout(timer);
        unsub();
        await this.dismiss(tabId);
        resolve(data as DialogState);
      });
    });
  }
}

export function createDialogAPI(client: PiggyClient): DialogClient {
  return new DialogClient(client);
}