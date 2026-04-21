export declare function randomDelay(min: number, max: number): Promise<void>;
/**
 * Simulates human typing by introducing ~2 random typos and correcting them.
 * Returns an array of { char, isBackspace } actions to replay.
 */
export declare function humanTypeSequence(text: string): string[];
//# sourceMappingURL=index.d.ts.map