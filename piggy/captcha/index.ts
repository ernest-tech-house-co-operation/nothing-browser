// piggy/captcha/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";

export interface CaptchaState {
  detected: boolean;
  paused: boolean;
  type: string; // "cloudflare" | "recaptcha" | "hcaptcha" | "generic"
}

export interface BlockState {
  detected: boolean;
  type: string; // "403" | "access-denied" | "firewall" | "rate-limit"
}

export class CaptchaClient {
  constructor(private client: PiggyClient) {}

  // ── Captcha ───────────────────────────────────────────────────────────────

  status(tabId = "default"): Promise<CaptchaState> {
    return this.client.send("captcha.status", { tabId });
  }

  resolve(tabId = "default"): Promise<void> {
    return this.client.send("captcha.resolve", { tabId });
  }

  pause(tabId = "default"): Promise<void> {
    return this.client.send("captcha.pause", { tabId });
  }

  check(tabId = "default"): Promise<void> {
    return this.client.send("captcha.check", { tabId });
  }

  setAutoRetry(enabled: boolean): Promise<void> {
    return this.client.send("captcha.autoRetry", { enabled });
  }

  // ── Block ─────────────────────────────────────────────────────────────────

  blockStatus(tabId = "default"): Promise<BlockState> {
    return this.client.send("block.status", { tabId });
  }

  blockRetry(tabId = "default"): Promise<void> {
    return this.client.send("block.retry", { tabId });
  }

  // ── Event subscriptions ───────────────────────────────────────────────────

  onCaptcha(tabId: string, handler: (data: { captchaType: string; tabId: string }) => void): () => void {
    return this.client.onEvent("captcha", tabId, handler);
  }

  onCaptchaResolved(tabId: string, handler: (data: { tabId: string }) => void): () => void {
    return this.client.onEvent("captcha:resolved", tabId, handler);
  }

  onBlocked(tabId: string, handler: (data: { blockType: string; tabId: string }) => void): () => void {
    return this.client.onEvent("blocked", tabId, handler);
  }

  onBlockRetry(tabId: string, handler: (data: { tabId: string; proxy: string }) => void): () => void {
    return this.client.onEvent("block:retry", tabId, handler);
  }

  // ── Convenience: wait until captcha is resolved ───────────────────────────

  waitForResolution(tabId = "default", timeoutMs = 300_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`captcha.waitForResolution: timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = this.onCaptchaResolved(tabId, () => {
        clearTimeout(timer);
        unsub();
        resolve();
      });

      logger.warn(`[captcha] waiting for manual resolution on tab ${tabId}…`);
    });
  }
}

// ── Factory helper so site objects can expose a .captcha sub-namespace ────────

export function createCaptchaAPI(client: PiggyClient): CaptchaClient {
  return new CaptchaClient(client);
}