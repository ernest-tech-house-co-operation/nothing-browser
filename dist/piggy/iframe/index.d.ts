import { PiggyClient } from "../client";
export interface IframeDescriptor {
    index: number;
    src: string;
    id: string;
    name: string;
}
/** Target an iframe by its index or src. One must be provided. */
export type IframeTarget = {
    index: number;
    src?: never;
} | {
    src: string;
    index?: never;
};
export type IframeEvaluateOptions = IframeTarget & {
    js: string;
};
export type IframeClickOptions = IframeTarget & {
    sel: string;
};
export type IframeTypeOptions = IframeTarget & {
    sel: string;
    text: string;
};
export type IframeTextOptions = IframeTarget & {
    sel: string;
};
export type IframeHtmlOptions = IframeTarget;
export type IframeWaitSelOptions = IframeTarget & {
    sel: string;
    timeout?: number;
};
export declare class IframeClient {
    private client;
    constructor(client: PiggyClient);
    /** List all iframes on the page: index, src, id, name. */
    list(tabId?: string): Promise<IframeDescriptor[]>;
    /** Run arbitrary JS inside the targeted iframe. Returns whatever the script returns. */
    evaluate(opts: IframeEvaluateOptions, tabId?: string): Promise<unknown>;
    /** Click a selector inside the targeted iframe. */
    click(opts: IframeClickOptions, tabId?: string): Promise<boolean>;
    /** Type text into a selector inside the targeted iframe. */
    type(opts: IframeTypeOptions, tabId?: string): Promise<boolean>;
    /** Get innerText of a selector inside the targeted iframe. */
    text(opts: IframeTextOptions, tabId?: string): Promise<string>;
    /** Get the full HTML of the targeted iframe. */
    html(opts: IframeHtmlOptions, tabId?: string): Promise<string>;
    /** Wait until a selector appears inside the targeted iframe. */
    waitSel(opts: IframeWaitSelOptions, tabId?: string): Promise<boolean>;
}
export declare function createIframeAPI(client: PiggyClient): IframeClient;
//# sourceMappingURL=index.d.ts.map