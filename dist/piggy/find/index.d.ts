import { PiggyClient } from "../client";
export interface ElementDescriptor {
    tag: string;
    id: string;
    cls: string;
    /** First 400 chars of innerText */
    text: string;
    /** First 800 chars of innerHTML */
    html: string;
    href: string;
    src: string;
    value: string;
    attrs: Record<string, string>;
}
export declare class FindClient {
    private client;
    constructor(client: PiggyClient);
    /** querySelectorAll — returns all matching elements. */
    css(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Alias for css(). */
    all(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** querySelector — returns a single-element array or []. */
    first(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements whose innerText contains the given text. */
    byText(text: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements by attribute name (and optional value). */
    byAttr(attr: string, value?: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** getElementsByTagName. */
    byTag(tag: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find inputs/textareas whose placeholder contains the given text. */
    byPlaceholder(text: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements by ARIA role, optionally filtered by accessible name. */
    byRole(role: string, name?: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Direct children of the matched element. */
    children(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** parentElement of the matched element. */
    parent(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Walk up the DOM from selector until ancestor matches. */
    closest(selector: string, ancestor: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Number of elements matching the selector. */
    count(selector: string, tabId?: string): Promise<number>;
    /** True if at least one element matches. */
    exists(selector: string, tabId?: string): Promise<boolean>;
    /** True if the first matched element is visible. */
    visible(selector: string, tabId?: string): Promise<boolean>;
    /** True if the first matched element is not disabled. */
    enabled(selector: string, tabId?: string): Promise<boolean>;
    /** True if the first matched checkbox/radio is checked. */
    checked(selector: string, tabId?: string): Promise<boolean>;
}
export declare function createFindAPI(client: PiggyClient): FindClient;
//# sourceMappingURL=index.d.ts.map