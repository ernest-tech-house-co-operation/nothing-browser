// piggy/dialog/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";

export interface DialogState {
  pending: boolean;
  type: string;         // "alert" | "confirm" | "prompt" | "beforeunload"
  message: string;
  defaultValue: string;
}

// Event data from C++ (doesn't include pending)
interface DialogEventData {
  dialogType: string;
  message: string;
  defaultValue: string;
  tabId: string;
}

export class DialogClient {
  constructor(private client: PiggyClient) {}

  accept(tabId = "default", text?: string): Promise<void> {
    return this.client.send("dialog.accept", { tabId, ...(text !== undefined ? { text } : {}) });
  }

  dismiss(tabId = "default"): Promise<void> {
    return this.client.send("dialog.dismiss", { tabId });
  }

  status(tabId = "default"): Promise<DialogState> {
    return this.client.send("dialog.status", { tabId });
  }

  setAutoAction(tabId = "default", action: "accept" | "dismiss" | ""): Promise<void> {
    return this.client.send("dialog.onDialog", { tabId, action });
  }

  upload(selector: string, filePath: string, tabId = "default"): Promise<void> {
    return this.client.send("upload", { selector, path: filePath, tabId });
  }

  onDialog(
    tabId: string,
    handler: (data: DialogEventData) => void
  ): () => void {
    return this.client.onEvent("dialog", tabId, handler);
  }

  waitAndAccept(tabId = "default", text?: string, timeoutMs = 30_000): Promise<DialogEventData> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`dialog.waitAndAccept: timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = this.onDialog(tabId, async (data) => {
        clearTimeout(timer);
        unsub();
        await this.accept(tabId, text);
        resolve(data);
      });
    });
  }

  waitAndDismiss(tabId = "default", timeoutMs = 30_000): Promise<DialogEventData> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`dialog.waitAndDismiss: timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = this.onDialog(tabId, async (data) => {
        clearTimeout(timer);
        unsub();
        await this.dismiss(tabId);
        resolve(data);
      });
    });
  }
}

export function createDialogAPI(client: PiggyClient): DialogClient {
  return new DialogClient(client);
}