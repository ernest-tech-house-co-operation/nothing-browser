// piggy/media/index.ts
import { PiggyClient } from "../client";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

export class MediaClient {
  constructor(private client: PiggyClient) {}

  // ── Screenshot ────────────────────────────────────────────────────────────

  async screenshot(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.client.send<string>("screenshot", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
      return filePath;
    }
    return b64;
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  async pdf(filePath?: string, tabId = "default"): Promise<string> {
    const b64 = await this.client.send<string>("pdf", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
      return filePath;
    }
    return b64;
  }

  // ── Image blocking ────────────────────────────────────────────────────────

  blockImages(tabId = "default"): Promise<void> {
    return this.client.send("intercept.block.images", { tabId });
  }

  unblockImages(tabId = "default"): Promise<void> {
    return this.client.send("intercept.unblock.images", { tabId });
  }
}

export function createMediaAPI(client: PiggyClient): MediaClient {
  return new MediaClient(client);
}
