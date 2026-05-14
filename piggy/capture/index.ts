// piggy/capture/index.ts
import { PiggyClient } from "../client";

export interface CapturedRequest {
  method: string;
  url: string;
  status: string;
  type: string;
  mime: string;
  reqHeaders: string;
  reqBody: string;
  resHeaders: string;
  resBody: string;
  size: number;
  timestamp: string;
}

export interface WebSocketFrame {
  connectionId: string;
  url: string;
  direction: string;
  data: string;
  binary: boolean;
  timestamp: string;
}

export interface CapturedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  expires: string;
}

export interface StorageEntry {
  key: string;
  value: string;
}

export class CaptureClient {
  constructor(private client: PiggyClient) {}

  start(tabId = "default"): Promise<void> {
    return this.client.send("capture.start", { tabId });
  }

  stop(tabId = "default"): Promise<void> {
    return this.client.send("capture.stop", { tabId });
  }

  requests(tabId = "default"): Promise<CapturedRequest[]> {
    return this.client.send("capture.requests", { tabId });
  }

  ws(tabId = "default"): Promise<WebSocketFrame[]> {
    return this.client.send("capture.ws", { tabId });
  }

  cookies(tabId = "default"): Promise<CapturedCookie[]> {
    return this.client.send("capture.cookies", { tabId });
  }

  storage(tabId = "default"): Promise<StorageEntry[]> {
    return this.client.send("capture.storage", { tabId });
  }

  clear(tabId = "default"): Promise<void> {
    return this.client.send("capture.clear", { tabId });
  }
}

export function createCaptureAPI(client: PiggyClient): CaptureClient {
  return new CaptureClient(client);
}