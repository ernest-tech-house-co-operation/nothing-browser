// piggy/human/index.ts
import { PiggyClient } from "../client";

// ─── Local human-simulation utilities ────────────────────────────────────────

export function randomDelay(min: number, max: number): Promise<void> {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

/**
 * Simulates human typing by introducing ~2 random typos and correcting them.
 * Returns an array of chars / "BACKSPACE" actions to replay.
 */
export function humanTypeSequence(text: string): string[] {
  const adjacent: Record<string, string[]> = {
    a: ["q","w","s","z"], b: ["v","g","h","n"], c: ["x","d","f","v"],
    d: ["s","e","r","f","c","x"], e: ["w","r","d","s"],
    f: ["d","r","t","g","v","c"], g: ["f","t","y","h","b","v"],
    h: ["g","y","u","j","n","b"], i: ["u","o","k","j"],
    j: ["h","u","i","k","m","n"], k: ["j","i","o","l","m"],
    l: ["k","o","p"], m: ["n","j","k"], n: ["b","h","j","m"],
    o: ["i","p","l","k"], p: ["o","l"], q: ["w","a"],
    r: ["e","t","f","d"], s: ["a","w","e","d","x","z"],
    t: ["r","y","g","f"], u: ["y","i","h","j"],
    v: ["c","f","g","b"], w: ["q","e","a","s"],
    x: ["z","s","d","c"], y: ["t","u","g","h"],
    z: ["a","s","x"],
  };

  const actions: string[] = [];
  const typoIndices = new Set<number>();

  if (text.length > 4) {
    let tries = 0;
    while (typoIndices.size < 2 && tries < 20) {
      typoIndices.add(Math.floor(Math.random() * text.length));
      tries++;
    }
  }

  for (let i = 0; i < text.length; i++) {
    if (typoIndices.has(i)) {
      const ch = text[i]!.toLowerCase();
      const neighbors = adjacent[ch];
      const typo = neighbors
        ? neighbors[Math.floor(Math.random() * neighbors.length)] ?? ch
        : ch;
      actions.push(typo);
      actions.push("BACKSPACE");
    }
    actions.push(text[i]!);
  }

  return actions;
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Profile types ────────────────────────────────────────────────────────────

export type TypingSpeed  = "slow" | "normal" | "fast";
export type ClickDelay   = "cautious" | "normal" | "fast";
export type ScrollSpeed  = "slow" | "normal" | "fast";

export interface HumanProfile {
  typingSpeed:  TypingSpeed;
  clickDelay:   ClickDelay;
  scrollSpeed:  ScrollSpeed;
  mouseWiggle:  boolean;
}

// ─── Option types ─────────────────────────────────────────────────────────────

export interface HumanSetOptions {
  typingSpeed?:  TypingSpeed;
  clickDelay?:   ClickDelay;
  scrollSpeed?:  ScrollSpeed;
  mouseWiggle?:  boolean;
}

export interface HumanTypeOptions {
  selector: string;
  text:     string;
  /** Clear field first with Ctrl+A + Delete. Default: false. */
  clear?:   boolean;
  /** Override the profile typing speed for this call. */
  speed?:   TypingSpeed;
}

export interface HumanClickOptions {
  selector: string;
  /**
   * Scroll into view + dispatch all mouse events manually,
   * even if the element is covered. Falls back to el.click().
   */
  force?:   boolean;
}

// ─── HumanClient ─────────────────────────────────────────────────────────────

export class HumanClient {
  constructor(private client: PiggyClient) {}

  /**
   * Update the global human-behavior profile.
   * Only the fields you pass are changed.
   */
  set(opts: HumanSetOptions, tabId = "default"): Promise<void> {
    return this.client.send("human.set", { ...opts, tabId });
  }

  /**
   * Type text into a selector character-by-character with realistic delays.
   * Respects the current profile typingSpeed unless `speed` is overridden.
   */
  type(opts: HumanTypeOptions, tabId = "default"): Promise<void> {
    return this.client.send("human.type", { ...opts, tabId });
  }

  /**
   * Click a selector with a human-like delay before the click.
   * Set force:true to bypass visibility/coverage checks.
   */
  click(opts: HumanClickOptions, tabId = "default"): Promise<void> {
    return this.client.send("human.click", { ...opts, tabId });
  }

  /**
   * Return the current global HumanProfile settings.
   */
  get(tabId = "default"): Promise<HumanProfile> {
    return this.client.send("human.get", { tabId });
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

export function createHumanAPI(client: PiggyClient): HumanClient {
  return new HumanClient(client);
}