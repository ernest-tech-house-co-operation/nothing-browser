// piggy/navigation/index.js
import { PiggyClient } from "../client/index.js";

export class NavigationClient {
  constructor(client) {
    this.client = client;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigate(url, tabId = "default") {
    return this.client.send("navigate", { url, tabId });
  }

  reload(tabId = "default") {
    return this.client.send("reload", { tabId });
  }

  goBack(tabId = "default") {
    return this.client.send("go.back", { tabId });
  }

  goForward(tabId = "default") {
    return this.client.send("go.forward", { tabId });
  }

  // ── Page info ─────────────────────────────────────────────────────────────

  url(tabId = "default") {
    return this.client.send("page.url", { tabId });
  }

  title(tabId = "default") {
    return this.client.send("page.title", { tabId });
  }

  content(tabId = "default") {
    return this.client.send("page.content", { tabId });
  }

  // ── Wait ──────────────────────────────────────────────────────────────────

  waitForNavigation(tabId = "default") {
    return this.client.send("wait.navigation", { tabId });
  }

  waitForSelector(selector, timeout = 10000, tabId = "default") {
    return this.client.send("wait.selector", { selector, timeout, tabId });
  }
}

export function createNavigationAPI(client) {
  return new NavigationClient(client);
}