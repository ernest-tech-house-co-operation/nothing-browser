// piggy/captcha/index.js
import { PiggyClient } from "../client.js";
import logger from "../logger.js";

export class CaptchaClient {
  constructor(client) {
    this.client = client;
  }

  // ── Captcha ───────────────────────────────────────────────────────────────

  status(tabId = "default") {
    return this.client.send("captcha.status", { tabId });
  }

  resolve(tabId = "default") {
    return this.client.send("captcha.resolve", { tabId });
  }

  pause(tabId = "default") {
    return this.client.send("captcha.pause", { tabId });
  }

  check(tabId = "default") {
    return this.client.send("captcha.check", { tabId });
  }

  setAutoRetry(enabled) {
    return this.client.send("captcha.autoRetry", { enabled });
  }

  // ── Block ─────────────────────────────────────────────────────────────────

  blockStatus(tabId = "default") {
    return this.client.send("block.status", { tabId });
  }

  blockRetry(tabId = "default") {
    return this.client.send("block.retry", { tabId });
  }

  // ── Event subscriptions ───────────────────────────────────────────────────

  onCaptcha(tabId, handler) {
    return this.client.onEvent("captcha", tabId, handler);
  }

  onCaptchaResolved(tabId, handler) {
    return this.client.onEvent("captcha:resolved", tabId, handler);
  }

  onBlocked(tabId, handler) {
    return this.client.onEvent("blocked", tabId, handler);
  }

  onBlockRetry(tabId, handler) {
    return this.client.onEvent("block:retry", tabId, handler);
  }

  // ── Convenience: wait until captcha is resolved ───────────────────────────

  waitForResolution(tabId = "default", timeoutMs = 300_000) {
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

export function createCaptchaAPI(client) {
  return new CaptchaClient(client);
}