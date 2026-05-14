import { PiggyClient } from "../client";
export interface DialogState {
    pending: boolean;
    type: string;
    message: string;
    defaultValue: string;
}
interface DialogEventData {
    dialogType: string;
    message: string;
    defaultValue: string;
    tabId: string;
}
export declare class DialogClient {
    private client;
    constructor(client: PiggyClient);
    accept(tabId?: string, text?: string): Promise<void>;
    dismiss(tabId?: string): Promise<void>;
    status(tabId?: string): Promise<DialogState>;
    setAutoAction(tabId: string | undefined, action: "accept" | "dismiss" | ""): Promise<void>;
    upload(selector: string, filePath: string, tabId?: string): Promise<void>;
    onDialog(tabId: string, handler: (data: DialogEventData) => void): () => void;
    waitAndAccept(tabId?: string, text?: string, timeoutMs?: number): Promise<DialogEventData>;
    waitAndDismiss(tabId?: string, timeoutMs?: number): Promise<DialogEventData>;
}
export declare function createDialogAPI(client: PiggyClient): DialogClient;
export {};
//# sourceMappingURL=index.d.ts.map