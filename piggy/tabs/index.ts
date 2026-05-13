// piggy/tabs/index.ts
import { PiggyClient } from "../client";

export class TabsClient {
  constructor(private client: PiggyClient) {}

  new(): Promise<string> {
    return this.client.send("tab.new", {});
  }

  close(tabId: string): Promise<void> {
    return this.client.send("tab.close", { tabId });
  }

  list(): Promise<string[]> {
    return this.client.send("tab.list", {});
  }
}

export function createTabsAPI(client: PiggyClient): TabsClient {
  return new TabsClient(client);
}
