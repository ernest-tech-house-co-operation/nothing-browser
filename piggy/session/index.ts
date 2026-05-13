// piggy/session/index.ts
import { PiggyClient } from "../client";

export interface SessionPaths {
  workDir: string;
  cookies: string;
  profile: string;
  ws: string;
  pings: string;
}

export interface CookieSetOptions {
  name: string;
  value: string;
  domain: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  expiry?: number;
}

export interface CookieDeleteOptions {
  name: string;
  domain: string;
}

export class SessionClient {
  constructor(private client: PiggyClient) {}

  // ── Session lifecycle ─────────────────────────────────────────────────────

  reload(tabId = "default"): Promise<void> {
    return this.client.send("session.reload", { tabId });
  }

  // ── Paths ─────────────────────────────────────────────────────────────────

  paths(): Promise<SessionPaths> {
    return this.client.send("session.paths", {});
  }

  cookiesPath(): Promise<string> {
    return this.client.send("session.cookies.path", {});
  }

  profilePath(): Promise<string> {
    return this.client.send("session.profile.path", {});
  }

  wsPath(): Promise<string> {
    return this.client.send("session.ws.path", {});
  }

  pingsPath(): Promise<string> {
    return this.client.send("session.pings.path", {});
  }

  // ── Opt-in persistence ────────────────────────────────────────────────────

  setWsSave(enabled: boolean): Promise<void> {
    return this.client.send("session.ws.save", { enabled });
  }

  setPingsSave(enabled: boolean): Promise<void> {
    return this.client.send("session.pings.save", { enabled });
  }

  // ── Export / import ───────────────────────────────────────────────────────

  async export(tabId = "default"): Promise<any> {
    const raw = await this.client.send<string>("session.export", { tabId });
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  import(data: any, tabId = "default"): Promise<void> {
    return this.client.send("session.import", {
      data: JSON.stringify(data),
      tabId,
    });
  }

  // ── Cookies ───────────────────────────────────────────────────────────────

  setCookie(opts: CookieSetOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.set", { ...opts, tabId });
  }

  deleteCookie(opts: CookieDeleteOptions, tabId = "default"): Promise<void> {
    return this.client.send("cookie.delete", { ...opts, tabId });
  }
}

export function createSessionAPI(client: PiggyClient): SessionClient {
  return new SessionClient(client);
}
