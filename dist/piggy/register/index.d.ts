import { PiggyClient } from "../client";
import { TabPool } from "../pool";
export declare let humanMode: boolean;
export declare function setClient(c: PiggyClient | null): void;
export declare function setHumanMode(v: boolean): void;
export declare function createSiteObject(name: string, registeredUrl: string, client: PiggyClient, tabId: string, pool?: TabPool): any;
export type SiteObject = ReturnType<typeof createSiteObject>;
export declare function createExposedAPI<T extends Record<string, (data: any) => any>>(site: any, apiName: string, handlers: T): Promise<void>;
//# sourceMappingURL=index.d.ts.map