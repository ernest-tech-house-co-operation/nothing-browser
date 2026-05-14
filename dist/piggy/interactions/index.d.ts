import { PiggyClient } from "../client";
export interface MousePosition {
    x: number;
    y: number;
}
export declare class InteractionsClient {
    private client;
    constructor(client: PiggyClient);
    click(selector: string, tabId?: string): Promise<boolean>;
    dblclick(selector: string, tabId?: string): Promise<boolean>;
    hover(selector: string, tabId?: string): Promise<boolean>;
    type(selector: string, text: string, tabId?: string): Promise<boolean>;
    typeClear(selector: string, text: string, tabId?: string): Promise<boolean>;
    select(selector: string, value: string, tabId?: string): Promise<boolean>;
    scrollTo(selector: string, tabId?: string): Promise<boolean>;
    scrollBy(px: number, tabId?: string): Promise<boolean>;
    keyPress(key: string, tabId?: string): Promise<boolean>;
    keyCombo(combo: string, tabId?: string): Promise<boolean>;
    mouseMove(x: number, y: number, tabId?: string): Promise<boolean>;
    mouseDrag(from: MousePosition, to: MousePosition, tabId?: string): Promise<boolean>;
    evaluate(js: string, tabId?: string): Promise<unknown>;
}
export declare function createInteractionsAPI(client: PiggyClient): InteractionsClient;
//# sourceMappingURL=index.d.ts.map