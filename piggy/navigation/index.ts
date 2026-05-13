// piggy/navigation/index.ts
import { PiggyClient } from "../client";

export class NavigationClient {
  constructor(private client: PiggyClient) {}

  // ── Navigation ────────────────────────────────────────────────────────────

  navigate(url: string, tabId = "default"): Promise<void> {
    return this.client.send("navigate", { url, tabId });
  }

  reload(tabId = "default"): Promise<void> {
    return this.client.send("reload", { tabId });
  }

  goBack(tabId = "default"): Promise<void> {
    return this.client.send("go.back", { tabId });
  }

  goForward(tabId = "default"): Promise<void> {
    return this.client.send("go.forward", { tabId });
  }

  // ── Page info ─────────────────────────────────────────────────────────────

  url(tabId = "default"): Promise<string> {
    return this.client.send("page.url", { tabId });
  }

  title(tabId = "default"): Promise<string> {
    return this.client.send("page.title", { tabId });
  }

  content(tabId = "default"): Promise<string> {
    return this.client.send("page.content", { tabId });
  }

  // ── Wait ──────────────────────────────────────────────────────────────────

  waitForNavigation(tabId = "default"): Promise<void> {
    return this.client.send("wait.navigation", { tabId });
  }

  waitForSelector(selector: string, timeout = 10000, tabId = "default"): Promise<void> {
    return this.client.send("wait.selector", { selector, timeout, tabId });
  }
}

export function createNavigationAPI(client: PiggyClient): NavigationClient {
  return new NavigationClient(client);
}
