import { type SiteObject } from "./piggy/register";
declare const piggy: any;
type TypedPiggy<Sites extends string> = typeof piggy & {
    [K in Sites]: SiteObject;
};
export declare function usePiggy<Sites extends string>(): TypedPiggy<Sites>;
export type { SiteObject };
export default piggy;
export { piggy };
//# sourceMappingURL=piggy.d.ts.map