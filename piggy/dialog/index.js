// piggy/dialog/index.js
import { PiggyClient } from "../client/index.js";
import logger from "../logger/index.js";

export class DialogClient {
  constructor(client) {
    this.client = client;
  }

  accept(tabId = "default", text) {
    return this.client.send("dialog.accept", { tabId, ...(text !== undefined ? { text } : {}) });
  }

  dismiss(tabId = "default") {
    return this.client.send("dialog.dismiss", { tabId });
  }

  status(tabId = "default") {
    return this.client.send("dialog.status", { tabId });
  }

  setAutoAction(tabId = "default", action) {
    return this.client.send("dialog.onDialog", { tabId, action });
  }

  upload(selector, filePath, tabId = "default") {
    return this.client.send("upload", { selector, path: filePath, tabId });
  }

  onDialog(tabId, handler) {
    return this.client.onEvent("dialog", tabId, handler);
  }

  waitAndAccept(tabId = "default", text, timeoutMs = 30_000) {
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

  waitAndDismiss(tabId = "default", timeoutMs = 30_000) {
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

export function createDialogAPI(client) {
  return new DialogClient(client);
}