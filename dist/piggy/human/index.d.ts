import { PiggyClient } from "../client";
export declare function randomDelay(min: number, max: number): Promise<void>;
export declare function humanTypeSequence(text: string): string[];
export type TypingSpeed = "slow" | "normal" | "fast";
export type ClickDelay = "cautious" | "normal" | "fast";
export type ScrollSpeed = "slow" | "normal" | "fast";
export interface HumanProfile {
    typingSpeed: TypingSpeed;
    clickDelay: ClickDelay;
    scrollSpeed: ScrollSpeed;
    mouseWiggle: boolean;
}
export interface HumanSetOptions {
    typingSpeed?: TypingSpeed;
    clickDelay?: ClickDelay;
    scrollSpeed?: ScrollSpeed;
    mouseWiggle?: boolean;
}
export interface HumanTypeOptions {
    selector: string;
    text: string;
    clear?: boolean;
    speed?: number;
}
export interface HumanClickOptions {
    selector: string;
    force?: boolean;
    delay?: number;
}
export declare class HumanClient {
    private client;
    constructor(client: PiggyClient);
    set(opts: HumanSetOptions, tabId?: string): Promise<HumanProfile>;
    get(tabId?: string): Promise<HumanProfile>;
    type(opts: HumanTypeOptions, tabId?: string): Promise<void>;
    click(opts: HumanClickOptions, tabId?: string): Promise<void>;
}
export declare function createHumanAPI(client: PiggyClient): HumanClient;
//# sourceMappingURL=index.d.ts.map