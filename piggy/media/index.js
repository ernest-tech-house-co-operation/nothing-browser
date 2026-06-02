// piggy/media/index.js
import { PiggyClient } from "../client/index.js";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

export class MediaClient {
  constructor(client) {
    this.client = client;
  }

  // ── Screenshot ────────────────────────────────────────────────────────────

  async screenshot(filePath, tabId = "default") {
    const b64 = await this.client.send("screenshot", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
      return filePath;
    }
    return b64;
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  async pdf(filePath, tabId = "default") {
    const b64 = await this.client.send("pdf", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
      return filePath;
    }
    return b64;
  }

  // ── Image blocking ────────────────────────────────────────────────────────

  blockImages(tabId = "default") {
    return this.client.send("intercept.block.images", { tabId });
  }

  unblockImages(tabId = "default") {
    return this.client.send("intercept.unblock.images", { tabId });
  }
}

export function createMediaAPI(client) {
  return new MediaClient(client);
}