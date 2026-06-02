// piggy/session/index.js
import { PiggyClient } from "../client/index.js";

export class SessionClient {
  constructor(client) {
    this.client = client;
  }

  // Session lifecycle
  reload(tabId = "default") {
    return this.client.send("session.reload", { tabId });
  }

  // Paths
  paths() {
    return this.client.send("session.paths", {});
  }

  cookiesPath() {
    return this.client.send("session.cookies.path", {});
  }

  profilePath() {
    return this.client.send("session.profile.path", {});
  }

  wsPath() {
    return this.client.send("session.ws.path", {});
  }

  pingsPath() {
    return this.client.send("session.pings.path", {});
  }

  // Opt-in persistence
  setWsSave(enabled) {
    return this.client.send("session.ws.save", { enabled });
  }

  setPingsSave(enabled) {
    return this.client.send("session.pings.save", { enabled });
  }

  // Export / import
  async export(tabId = "default") {
    const raw = await this.client.send("session.export", { tabId });
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  import(data, tabId = "default") {
    return this.client.send("session.import", {
      data: JSON.stringify(data),
      tabId,
    });
  }

  // Cookies
  setCookie(opts, tabId = "default") {
    return this.client.send("cookie.set", { ...opts, tabId });
  }

  deleteCookie(opts, tabId = "default") {
    return this.client.send("cookie.delete", { ...opts, tabId });
  }
}

export function createSessionAPI(client) {
  return new SessionClient(client);
}