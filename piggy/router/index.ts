// piggy/router/index.ts
// Mirrors PiggyCommandRouter.cpp.
// This is the single entry point that composes all sub-clients
// into one object — the same way the C++ router dispatches to sub-handlers.

import { PiggyClient } from "../client";
import { CaptureClient, createCaptureAPI } from "../capture";
import { CaptchaClient, createCaptchaAPI } from "../captcha";
import { DialogClient, createDialogAPI } from "../dialog";
import { ExportClient, createExportAPI } from "../export";
import { FindClient, createFindAPI } from "../find";
import { HumanClient, createHumanAPI } from "../human";
import { IframeClient, createIframeAPI } from "../iframe";
import { InteractionsClient, createInteractionsAPI } from "../interactions";
import { MediaClient, createMediaAPI } from "../media";
import { NavigationClient, createNavigationAPI } from "../navigation";
import { ProvideClient, createProvideAPI } from "../provide";
import { ProxyClient, createProxyAPI } from "../proxy";
import { SessionClient, createSessionAPI } from "../session";
import { TabsClient, createTabsAPI } from "../tabs";
import { WaitClient, EvaluateClient, FetchClient, createWaitAPI, createEvaluateAPI, createFetchAPI } from "../wait";

export interface PiggyRouter {
  // Core transport
  client: PiggyClient;

  // Sub-routers — 1:1 with C++ files
  tabs: TabsClient;
  navigation: NavigationClient;
  interactions: InteractionsClient;
  media: MediaClient;
  capture: CaptureClient;
  find: FindClient;
  provide: ProvideClient;
  wait: WaitClient;
  evaluate: EvaluateClient;
  fetch: FetchClient;
  proxy: ProxyClient;
  captcha: CaptchaClient;
  dialog: DialogClient;
  human: HumanClient;
  iframe: IframeClient;
  session: SessionClient;
  export: ExportClient;
}

export function createRouter(client: PiggyClient): PiggyRouter {
  return {
    client,
    tabs:         createTabsAPI(client),
    navigation:   createNavigationAPI(client),
    interactions: createInteractionsAPI(client),
    media:        createMediaAPI(client),
    capture:      createCaptureAPI(client),
    find:         createFindAPI(client),
    provide:      createProvideAPI(client),
    wait:         createWaitAPI(client),
    evaluate:     createEvaluateAPI(client),
    fetch:        createFetchAPI(client),
    proxy:        createProxyAPI(client),
    captcha:      createCaptchaAPI(client),
    dialog:       createDialogAPI(client),
    human:        createHumanAPI(client),
    iframe:       createIframeAPI(client),
    session:      createSessionAPI(client),
    export:       createExportAPI(client),
  };
}

