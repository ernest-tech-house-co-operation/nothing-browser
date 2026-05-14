import { PiggyClient } from "../client";
export interface ProvideTable {
    headers: string[];
    rows: string[][];
}
export interface ProvideLink {
    text: string;
    href: string;
}
export interface ProvideImage {
    alt: string;
    src: string;
}
export interface ProvideForm {
    [name: string]: string;
}
export interface ProvidePage {
    title: string;
    url: string;
    html: string;
    text: string;
}
export interface ProvideDiv {
    tag: string;
    id: string;
    cls: string;
    text: string;
    html: string;
    children: ProvideDiv[];
}
export interface ProvideMeta {
    [name: string]: string;
}
export interface ProvideSelectOption {
    text: string;
    value: string;
    selected: boolean;
}
export interface ProvideSelect {
    value: string;
    options: ProvideSelectOption[];
}
export declare class ProvideClient {
    private client;
    constructor(client: PiggyClient);
    /** innerText of the first matched element. */
    text(selector: string, tabId?: string): Promise<string>;
    /** innerText of all matched elements. */
    textAll(selector: string, tabId?: string): Promise<string[]>;
    /** Single attribute value from the first matched element. */
    attr(selector: string, attr: string, tabId?: string): Promise<string>;
    /** Attribute value from all matched elements. */
    attrAll(selector: string, attr: string, tabId?: string): Promise<string[]>;
    /** innerHTML of the first matched element. */
    html(selector: string, tabId?: string): Promise<string>;
    /** Extract a table into headers + rows. */
    table(selector: string, tabId?: string): Promise<ProvideTable>;
    /** Extract a list of text items. Optionally scope items with itemSel. */
    list(selector: string, itemSel?: string, tabId?: string): Promise<string[]>;
    /** All links inside an optional selector. */
    links(selector?: string, tabId?: string): Promise<ProvideLink[]>;
    /** All images inside an optional selector. */
    images(selector?: string, tabId?: string): Promise<ProvideImage[]>;
    /** Form field name→value map. */
    form(selector: string, tabId?: string): Promise<ProvideForm>;
    /** Full page info: title, url, html, text. */
    page(tabId?: string): Promise<ProvidePage>;
    /** Structured div: tag, id, cls, text, html, children[]. */
    div(selector: string, tabId?: string): Promise<ProvideDiv>;
    /** All <meta> name→content pairs. */
    meta(tabId?: string): Promise<ProvideMeta>;
    /** <select> current value + all options. */
    select(selector: string, tabId?: string): Promise<ProvideSelect>;
    /**
     * Parse JSON from element innerText or script[type=application/json].
     * selector is optional — defaults to the first matching JSON script tag.
     */
    json(selector?: string, tabId?: string): Promise<unknown>;
}
export declare function createProvideAPI(client: PiggyClient): ProvideClient;
//# sourceMappingURL=index.d.ts.map