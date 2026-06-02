// piggy/pool/index.js
import { PiggyClient } from "../client/index.js";
import logger from "../logger/index.js";

export class TabPool {
  #idle = [];
  #busy = new Set();
  #queue = [];

  constructor(client, size, seedUrl, name) {
    this.client  = client;
    this.size    = size;
    this.seedUrl = seedUrl;
    this.name    = name;
  }

  async init() {
    for (let i = 0; i < this.size; i++) {
      const tabId = await this.client.newTab();
      await this.client.navigate(this.seedUrl, tabId);
      this.#idle.push(tabId);
      logger.success(`[${this.name}] pool tab ${i + 1}/${this.size} ready: ${tabId}`);
    }
  }

  acquire() {
    return new Promise(resolve => {
      const tabId = this.#idle.pop();
      if (tabId) {
        this.#busy.add(tabId);
        resolve(tabId);
      } else {
        this.#queue.push(resolve);
      }
    });
  }

  release(tabId) {
    this.#busy.delete(tabId);
    const next = this.#queue.shift();
    if (next) {
      this.#busy.add(tabId);
      next(tabId);
    } else {
      this.#idle.push(tabId);
    }
  }

  async withTab(fn) {
    logger.warn("[TabPool] withTab() is deprecated and will be removed in a later version — use the new tab API instead.");
    const tabId = await this.acquire();
    try {
      return await fn(tabId);
    } finally {
      this.release(tabId);
    }
  }

  async close() {
    for (const tabId of [...this.#idle, ...this.#busy]) {
      try { await this.client.closeTab(tabId); } catch {}
    }
    this.#idle  = [];
    this.#busy.clear();
    this.#queue = [];
  }

  get stats() {
    return {
      idle:   this.#idle.length,
      busy:   this.#busy.size,
      queued: this.#queue.length,
      total:  this.size,
    };
  }
}