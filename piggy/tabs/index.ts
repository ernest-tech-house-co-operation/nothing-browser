// piggy/tabs/index.ts
import { PiggyClient } from "../client";

export class TabsClient {
  constructor(private client: PiggyClient) {}

  new(): Promise<string> {
    return this.client.send("tab.new", {});
  }

  close(opts: string | { tabId: string }): Promise<void> {
    const tabId = typeof opts === "string" ? opts : opts.tabId;
    return this.client.send("tab.close", { tabId });
  }

  list(): Promise<string[]> {
    return this.client.send("tab.list", {});
  }
}

export function createTabsAPI(client: PiggyClient): TabsClient {
  return new TabsClient(client);
}
