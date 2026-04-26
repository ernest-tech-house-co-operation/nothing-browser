// piggy/pool/index.d.ts
import { PiggyClient } from "../client";

export declare class TabPool {
  constructor(client: PiggyClient, size: number, seedUrl: string, name: string);
  init(): Promise<void>;
  acquire(): Promise<string>;
  release(tabId: string): void;
  withTab<T>(fn: (tabId: string) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  get stats(): { idle: number; busy: number; queued: number; total: number };
}