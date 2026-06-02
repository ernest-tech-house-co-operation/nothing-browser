// piggy/capture/index.js
import { PiggyClient } from "../client/index.js";

export class CaptureClient {
  constructor(client) {
    this.client = client;
  }

  start(tabId = "default") {
    return this.client.send("capture.start", { tabId });
  }

  stop(tabId = "default") {
    return this.client.send("capture.stop", { tabId });
  }

  requests(tabId = "default") {
    return this.client.send("capture.requests", { tabId });
  }

  ws(tabId = "default") {
    return this.client.send("capture.ws", { tabId });
  }

  cookies(tabId = "default") {
    return this.client.send("capture.cookies", { tabId });
  }

  storage(tabId = "default") {
    return this.client.send("capture.storage", { tabId });
  }

  clear(tabId = "default") {
    return this.client.send("capture.clear", { tabId });
  }
}

export function createCaptureAPI(client) {
  return new CaptureClient(client);
}