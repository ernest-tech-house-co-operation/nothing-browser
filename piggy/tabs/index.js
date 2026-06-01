// piggy/tabs/index.js

export class TabsClient {
  constructor(client) {
    this.client = client;
  }

  new() {
    return this.client.send("tab.new", {});
  }

  close(opts) {
    const tabId = typeof opts === "string" ? opts : opts.tabId;
    return this.client.send("tab.close", { tabId });
  }

  list() {
    return this.client.send("tab.list", {});
  }
}

export function createTabsAPI(client) {
  return new TabsClient(client);
}