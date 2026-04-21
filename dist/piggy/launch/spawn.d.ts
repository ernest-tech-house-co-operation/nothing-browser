import { type BinaryMode } from "./detect";
export declare function killAllBrowsers(): void;
export declare function spawnBrowser(mode?: BinaryMode): Promise<string>;
export declare function spawnBrowserOnSocket(socketName: string, mode?: BinaryMode): Promise<void>;
export declare function killBrowser(): void;
//# sourceMappingURL=spawn.d.ts.map