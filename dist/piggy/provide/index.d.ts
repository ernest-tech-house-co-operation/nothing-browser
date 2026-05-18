import { PiggyClient } from "../client";
export interface ProvideOptions {
    /** CSS selector for the target element(s). */
    selector: string;
    /**
     * Optional parent selector to scope the query under.
     * Equivalent to: parent.querySelector(selector)
     */
    parent?: string;
}
export interface ProvideAttrOptions extends ProvideOptions {
    /** The attribute name to extract. */
    attr: string;
}
export interface ProvideListOptions extends ProvideOptions {
    /** Optional child selector to scope list items. */
    itemSel?: string;
}
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
    text(opts: ProvideOptions, tabId?: string): Promise<string>;
    /** innerText of all matched elements. */
    textAll(opts: ProvideOptions, tabId?: string): Promise<string[]>;
    /** Single attribute value from the first matched element. */
    attr(opts: ProvideAttrOptions, tabId?: string): Promise<string>;
    /** Attribute value from all matched elements. */
    attrAll(opts: ProvideAttrOptions, tabId?: string): Promise<string[]>;
    /** innerHTML of the first matched element. */
    html(opts: ProvideOptions, tabId?: string): Promise<string>;
    /** Extract a table into headers + rows. */
    table(opts: ProvideOptions, tabId?: string): Promise<ProvideTable>;
    /** Extract a list of text items, optionally scoped to child items. */
    list(opts: ProvideListOptions, tabId?: string): Promise<string[]>;
    /** All links inside the matched selector. */
    links(opts: ProvideOptions, tabId?: string): Promise<ProvideLink[]>;
    /** All images inside the matched selector. */
    images(opts: ProvideOptions, tabId?: string): Promise<ProvideImage[]>;
    /** Form field name→value map. */
    form(opts: ProvideOptions, tabId?: string): Promise<ProvideForm>;
    /** Full page info: title, url, html, text. No selector needed. */
    page(tabId?: string): Promise<ProvidePage>;
    /** Structured div tree: tag, id, cls, text, html, children[]. */
    div(opts: ProvideOptions, tabId?: string): Promise<ProvideDiv>;
    /** All <meta> name→content pairs. No selector needed. */
    meta(tabId?: string): Promise<ProvideMeta>;
    /** <select> current value + all options. */
    select(opts: ProvideOptions, tabId?: string): Promise<ProvideSelect>;
    /**
     * Parse JSON from element innerText or script[type=application/json].
     * selector is optional — defaults to the first matching JSON script tag.
     */
    json(opts?: Partial<ProvideOptions>, tabId?: string): Promise<unknown>;
}
export declare function createProvideAPI(client: PiggyClient): ProvideClient;
//# sourceMappingURL=index.d.ts.map