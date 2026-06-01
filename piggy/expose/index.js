import { PiggyClient } from "../client.js";
import logger from "../logger.js";

export async function exposeFunction(client, fnName, handler, tabId) {
  await client.exposeFunction(fnName, handler, tabId);
  logger.success(`[${tabId}] exposed function: ${fnName}`);
}

export async function unexposeFunction(client, fnName, tabId) {
  await client.unexposeFunction(fnName, tabId);
  logger.info(`[${tabId}] unexposed function: ${fnName}`);
}

export async function clearExposedFunctions(client, tabId) {
  await client.clearExposedFunctions(tabId);
  logger.info(`[${tabId}] cleared all exposed functions`);
}

export async function exposeAndInject(client, fnName, handler, injectionJs, tabId) {
  await client.exposeFunction(fnName, handler, tabId);
  const js = typeof injectionJs === "function" ? injectionJs(fnName) : injectionJs;
  await client.evaluate(js, tabId);
  logger.success(`[${tabId}] exposed and injected: ${fnName}`);
}