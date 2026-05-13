// piggy/find/index.d.ts
import { PiggyClient } from "../client";

// ─── Element descriptor ───────────────────────────────────────────────────────

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

// ─── Option types ─────────────────────────────────────────────────────────────

export interface FindByTextOptions {
  text: string;
  selector?: string;
  exact?: boolean;
}

export interface FindByAttrOptions {
  attr: string;
  value?: string;
  selector?: string;
}

export interface FindByRoleOptions {
  role: string;
  name?: string;
}

export interface FindClosestOptions {
  selector: string;
  ancestor: string;
}

export interface FindFilterOptions {
  selector: string;
  attr: string;
  value: string;
}

// ─── FindClient ───────────────────────────────────────────────────────────────

export declare class FindClient {
  constructor(client: PiggyClient);

  // Multi-result
  css(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
  all(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
  first(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
  byText(opts: FindByTextOptions, tabId?: string): Promise<ElementDescriptor[]>;
  byAttr(opts: FindByAttrOptions, tabId?: string): Promise<ElementDescriptor[]>;
  byTag(tag: string, tabId?: string): Promise<ElementDescriptor[]>;
  byPlaceholder(text: string, tabId?: string): Promise<ElementDescriptor[]>;
  byRole(opts: FindByRoleOptions, tabId?: string): Promise<ElementDescriptor[]>;
  children(selector: string, tabId?: string): Promise<ElementDescriptor[]>;
  filter(opts: FindFilterOptions, tabId?: string): Promise<ElementDescriptor[]>;

  // Traversal
  closest(opts: FindClosestOptions, tabId?: string): Promise<ElementDescriptor[]>;
  parent(selector: string, tabId?: string): Promise<ElementDescriptor[]>;

  // Boolean / numeric
  count(selector: string, tabId?: string): Promise<number>;
  exists(selector: string, tabId?: string): Promise<boolean>;
  visible(selector: string, tabId?: string): Promise<boolean>;
  enabled(selector: string, tabId?: string): Promise<boolean>;
  checked(selector: string, tabId?: string): Promise<boolean>;
}

export declare function createFindAPI(client: PiggyClient): FindClient;