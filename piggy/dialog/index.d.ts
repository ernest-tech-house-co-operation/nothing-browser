// piggy/dialog/index.d.ts
import { PiggyClient } from "../client";

export interface DialogState {
  pending: boolean;
  type: string;
  message: string;
  defaultValue: string;
}

export declare class DialogClient {
  constructor(client: PiggyClient);

  accept(tabId?: string, text?: string): Promise<void>;
  dismiss(tabId?: string): Promise<void>;
  status(tabId?: string): Promise<DialogState>;
  setAutoAction(tabId?: string, action: "accept" | "dismiss" | ""): Promise<void>;
  upload(selector: string, filePath: string, tabId?: string): Promise<void>;

  onDialog(
    tabId: string,
    handler: (data: { dialogType: string; message: string; defaultValue: string; tabId: string }) => void
  ): () => void;

  waitAndAccept(tabId?: string, text?: string, timeoutMs?: number): Promise<DialogState>;
  waitAndDismiss(tabId?: string, timeoutMs?: number): Promise<DialogState>;
}

export declare function createDialogAPI(client: PiggyClient): DialogClient;