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
export interface FindByTextOptions {
    text: string;
    /** Narrow the search to descendants of this CSS selector. */
    selector?: string;
    /** If true, innerText must match exactly (trimmed). Default: false. */
    exact?: boolean;
}
export interface FindByAttrOptions {
    attr: string;
    /** If omitted, matches any element that has the attribute at all. */
    value?: string;
    /** Optionally scope to a parent selector. */
    selector?: string;
}
export interface FindByRoleOptions {
    role: string;
    /** Filter by aria-label or innerText containing this string. */
    name?: string;
}
export interface FindClosestOptions {
    /** CSS selector for the starting element. */
    selector: string;
    /** CSS selector for the ancestor to climb to. */
    ancestor: string;
}
export interface FindFilterOptions {
    selector: string;
    attr: string;
    value: string;
}
export declare class FindClient {
    private client;
    constructor(client: PiggyClient);
    /** querySelectorAll — returns all matching elements. */
    css(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Alias for css() — querySelectorAll. */
    all(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** querySelector — returns a single-element array or []. */
    first(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements whose innerText contains (or exactly matches) the given text. */
    byText(opts: FindByTextOptions, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements by attribute name and optional value. */
    byAttr(opts: FindByAttrOptions, tabId?: string): Promise<ElementDescriptor[]>;
    /** getElementsByTagName. */
    byTag(tag: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find inputs/textareas whose placeholder contains the given text. */
    byPlaceholder(text: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Find elements by ARIA role, optionally filtered by aria-label / innerText. */
    byRole(opts: FindByRoleOptions, tabId?: string): Promise<ElementDescriptor[]>;
    /** Direct children of the matched element. */
    children(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /**
     * Filter querySelectorAll results by attribute value substring.
     * Equivalent to: querySelectorAll(selector).filter(el => el.attr.includes(value))
     */
    filter(opts: FindFilterOptions, tabId?: string): Promise<ElementDescriptor[]>;
    /** Walk up the DOM from selector until ancestor matches. */
    closest(opts: FindClosestOptions, tabId?: string): Promise<ElementDescriptor[]>;
    /** parentElement of the matched element. */
    parent(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
    /** Number of elements matching the selector. */
    count(selector: string, tabId?: string): Promise<number>;
    /** True if at least one element matches the selector. */
    exists(selector: string, tabId?: string): Promise<boolean>;
    /**
     * True if the first matched element is visible
     * (display !== none, visibility !== hidden, opacity !== 0).
     */
    visible(selector: string, tabId?: string): Promise<boolean>;
    /** True if the first matched element is not disabled. */
    enabled(selector: string, tabId?: string): Promise<boolean>;
    /** True if the first matched checkbox/radio is checked. */
    checked(selector: string, tabId?: string): Promise<boolean>;
}
export declare function createFindAPI(client: PiggyClient): FindClient;
//# sourceMappingURL=index.d.ts.map