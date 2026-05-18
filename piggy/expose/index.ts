import { PiggyClient } from "../client";
import logger from "../logger";

export async function exposeFunction(
  client: PiggyClient,
  fnName: string,
  handler: (data: any) => Promise<any> | any,
  tabId: string
): Promise<void> {
  await client.exposeFunction(fnName, handler, tabId);
  logger.success(`[${tabId}] exposed function: ${fnName}`);
}

export async function unexposeFunction(
  client: PiggyClient,
  fnName: string,
  tabId: string
): Promise<void> {
  await client.unexposeFunction(fnName, tabId);
  logger.info(`[${tabId}] unexposed function: ${fnName}`);
}

export async function clearExposedFunctions(
  client: PiggyClient,
  tabId: string
): Promise<void> {
  await client.clearExposedFunctions(tabId);
  logger.info(`[${tabId}] cleared all exposed functions`);
}

export async function exposeAndInject(
  client: PiggyClient,
  fnName: string,
  handler: (data: any) => Promise<any> | any,
  injectionJs: string | ((fnName: string) => string),
  tabId: string
): Promise<void> {
  await client.exposeFunction(fnName, handler, tabId);
  const js = typeof injectionJs === "function" ? injectionJs(fnName) : injectionJs;
  await client.evaluate(js, tabId);
  logger.success(`[${tabId}] exposed and injected: ${fnName}`);
}