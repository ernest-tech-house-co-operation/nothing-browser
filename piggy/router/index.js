// piggy/router/index.js
// Mirrors PiggyCommandRouter.cpp.
// This is the single entry point that composes all sub-clients
// into one object — the same way the C++ router dispatches to sub-handlers.

import { PiggyClient } from "../client.js";
import { createCaptureAPI } from "../capture/index.js";
import { createCaptchaAPI } from "../captcha/index.js";
import { createDialogAPI } from "../dialog/index.js";
import { createExportAPI } from "../export/index.js";
import { createFindAPI } from "../find/index.js";
import { createHumanAPI } from "../human/index.js";
import { createIframeAPI } from "../iframe/index.js";
import { createInteractionsAPI } from "../interactions/index.js";
import { createMediaAPI } from "../media/index.js";
import { createNavigationAPI } from "../navigation/index.js";
import { createProvideAPI } from "../provide/index.js";
import { createProxyAPI } from "../proxy/index.js";
import { createSessionAPI } from "../session/index.js";
import { createTabsAPI } from "../tabs/index.js";
import { createWaitAPI, createEvaluateAPI, createFetchAPI } from "../wait/index.js";

export function createRouter(client) {
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