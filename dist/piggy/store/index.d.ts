export type FieldType = "string" | "number" | "boolean" | "object" | "array";
export interface FieldSchema {
    type: FieldType;
    required?: boolean;
    default?: any;
}
export interface StoreSchema {
    name: string;
    destination: string;
    fields: Record<string, FieldSchema>;
}
export interface PiggyStoreConfig {
    stores: StoreSchema[];
}
export declare function loadStoreConfig(configPath?: string): PiggyStoreConfig;
export declare function getSchema(storeName: string): StoreSchema | null;
export declare function shapeRecord(data: Record<string, any>, schema: StoreSchema): Record<string, any>;
export declare function storeRecord(storeName: string, data: Record<string, any> | Record<string, any>[]): Promise<{
    stored: number;
    skipped: number;
}>;
//# sourceMappingURL=index.d.ts.map