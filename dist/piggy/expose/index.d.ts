import { PiggyClient } from "../client";
export declare function exposeFunction(client: PiggyClient, fnName: string, handler: (data: any) => Promise<any> | any, tabId: string): Promise<void>;
export declare function unexposeFunction(client: PiggyClient, fnName: string, tabId: string): Promise<void>;
export declare function clearExposedFunctions(client: PiggyClient, tabId: string): Promise<void>;
export declare function exposeAndInject(client: PiggyClient, fnName: string, handler: (data: any) => Promise<any> | any, injectionJs: string | ((fnName: string) => string), tabId: string): Promise<void>;
//# sourceMappingURL=index.d.ts.map