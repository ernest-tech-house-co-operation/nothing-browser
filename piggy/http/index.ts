// piggy/http/index.ts
// Mirrors PiggyHttp.cpp — connects to the HTTP server on port 2005.
// Use this when you want to talk to the browser over HTTP instead of the unix socket.

export interface HttpClientOptions {
  host?: string;
  port?: number;
  key: string;
}

export class PiggyHttpClient {
  private baseUrl: string;
  private key: string;

  constructor(opts: HttpClientOptions) {
    const host = opts.host ?? "localhost";
    const port = opts.port ?? 2005;
    this.baseUrl = `http://${host}:${port}`;
    this.key = opts.key;
  }

  // ── Health check ──────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Piggy-Key": this.key,
        },
        body: "hello",
      });
      const text = await res.text();
      return text.includes("active");
    } catch {
      return false;
    }
  }

  // ── Send command ──────────────────────────────────────────────────────────

  async send<T = any>(cmd: string, payload: Record<string, any> = {}): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Piggy-Key": this.key,
      },
      body: JSON.stringify({ id: String(Date.now()), cmd, payload }),
    });

    if (res.status === 401) throw new Error("Unauthorized — invalid X-Piggy-Key");
    if (res.status === 400) throw new Error("Bad request — invalid JSON");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as { ok: boolean; data: T };
    if (!data.ok) throw new Error(String(data.data) ?? "command failed");
    return data.data;
  }
}

export function createHttpClient(opts: HttpClientOptions): PiggyHttpClient {
  return new PiggyHttpClient(opts);
}
