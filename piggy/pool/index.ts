// piggy/pool/index.ts
import { PiggyClient } from "../client";
import logger from "../logger";

export class TabPool {
  private idle: string[] = [];
  private busy = new Set<string>();
  private queue: ((tabId: string) => void)[] = [];

  constructor(
    private client: PiggyClient,
    private size: number,
    private seedUrl: string,
    private name: string
  ) {}

  async init() {
    for (let i = 0; i < this.size; i++) {
      const tabId = await this.client.newTab();
      await this.client.navigate(this.seedUrl, tabId);
      this.idle.push(tabId);
      logger.success(`[${this.name}] pool tab ${i + 1}/${this.size} ready: ${tabId}`);
    }
  }

  acquire(): Promise<string> {
    return new Promise(resolve => {
      const tabId = this.idle.pop();
      if (tabId) {
        this.busy.add(tabId);
        resolve(tabId);
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(tabId: string) {
    this.busy.delete(tabId);
    const next = this.queue.shift();
    if (next) {
      this.busy.add(tabId);
      next(tabId);
    } else {
      this.idle.push(tabId);
    }
  }

  async withTab<T>(fn: (tabId: string) => Promise<T>): Promise<T> {
    const tabId = await this.acquire();
    try {
      return await fn(tabId);
    } finally {
      this.release(tabId);
    }
  }

  async close() {
    for (const tabId of [...this.idle, ...this.busy]) {
      try { await this.client.closeTab(tabId); } catch {}
    }
    this.idle = [];
    this.busy.clear();
    this.queue = [];
  }

  get stats() {
    return {
      idle:   this.idle.length,
      busy:   this.busy.size,
      queued: this.queue.length,
      total:  this.size,
    };
  }
}