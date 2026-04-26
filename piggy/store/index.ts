// piggy/store/index.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import logger from "../logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldType = "string" | "number" | "boolean" | "object" | "array";

export interface FieldSchema {
  type: FieldType;
  required?: boolean;        // default false — missing = NULL not error
  default?: any;             // fallback if missing (overrides NULL)
}

export interface StoreSchema {
  name: string;              // store identifier (matches site name or custom)
  destination: string;       // "./data.json" or "./data.db"
  fields: Record<string, FieldSchema>;
}

export interface PiggyStoreConfig {
  stores: StoreSchema[];
}

// ── Load piggy.store.json ─────────────────────────────────────────────────────

let _config: PiggyStoreConfig | null = null;

export function loadStoreConfig(configPath = "./piggy.store.json"): PiggyStoreConfig {
  if (_config) return _config;

  const abs = resolve(configPath);
  if (!existsSync(abs)) {
    logger.warn(`[store] piggy.store.json not found at ${abs} — store() calls will no-op`);
    return { stores: [] };
  }

  try {
    _config = JSON.parse(readFileSync(abs, "utf8")) as PiggyStoreConfig;
    logger.success(`[store] loaded ${_config.stores.length} schema(s) from ${abs}`);
    return _config;
  } catch (e: any) {
    logger.error(`[store] failed to parse piggy.store.json: ${e.message}`);
    return { stores: [] };
  }
}

export function getSchema(storeName: string): StoreSchema | null {
  const config = loadStoreConfig();
  return config.stores.find(s => s.name === storeName) ?? null;
}

// ── Validate & shape one record against schema ────────────────────────────────

export function shapeRecord(data: Record<string, any>, schema: StoreSchema): Record<string, any> {
  const shaped: Record<string, any> = {};

  for (const [field, def] of Object.entries(schema.fields)) {
    const raw = data[field];

    // Missing field
    if (raw === undefined || raw === null) {
      if (def.default !== undefined) {
        shaped[field] = def.default;
      } else {
        shaped[field] = null;  // NULL — not an error, just absent
      }
      continue;
    }

    // Type coercion / validation
    switch (def.type) {
      case "string":
        shaped[field] = String(raw);
        break;
      case "number":
        const n = Number(raw);
        shaped[field] = isNaN(n) ? null : n;
        break;
      case "boolean":
        shaped[field] = Boolean(raw);
        break;
      case "object":
        shaped[field] = typeof raw === "object" && !Array.isArray(raw) ? raw : null;
        break;
      case "array":
        shaped[field] = Array.isArray(raw) ? raw : null;
        break;
      default:
        shaped[field] = raw;
    }
  }

  // Extra fields on incoming data are silently dropped — not in schema = ignored
  return shaped;
}

// ── JSON backend ──────────────────────────────────────────────────────────────

function appendToJson(destination: string, record: Record<string, any>): void {
  const abs = resolve(destination);
  mkdirSync(dirname(abs), { recursive: true });

  let existing: any[] = [];
  if (existsSync(abs)) {
    try {
      existing = JSON.parse(readFileSync(abs, "utf8"));
      if (!Array.isArray(existing)) existing = [existing];
    } catch {
      existing = [];
    }
  }

  existing.push({ ...record, _storedAt: new Date().toISOString() });
  writeFileSync(abs, JSON.stringify(existing, null, 2), "utf8");
}

// ── SQLite backend ────────────────────────────────────────────────────────────

function appendToSqlite(destination: string, record: Record<string, any>, schema: StoreSchema): void {
  // Use bun:sqlite if available, else require better-sqlite3
  const abs = resolve(destination);
  mkdirSync(dirname(abs), { recursive: true });

  const isBun = typeof (globalThis as any).Bun !== "undefined";

  if (isBun) {
    const { Database } = require("bun:sqlite") as typeof import("bun:sqlite");
    const db = new Database(abs);
    ensureTable(db, schema, "bun");
    insertRecord(db, schema, record, "bun");
    db.close();
  } else {
    const Database = require("better-sqlite3");
    const db = new Database(abs);
    ensureTable(db, schema, "node");
    insertRecord(db, schema, record, "node");
    db.close();
  }
}

function ensureTable(db: any, schema: StoreSchema, runtime: "bun" | "node"): void {
  const tableName = schema.name.replace(/[^a-zA-Z0-9_]/g, "_");
  const cols = Object.entries(schema.fields).map(([name, def]) => {
    const sqlType = def.type === "number" ? "REAL"
      : def.type === "boolean" ? "INTEGER"
      : def.type === "object" || def.type === "array" ? "TEXT"  // JSON stringified
      : "TEXT";
    return `  ${name} ${sqlType}`;
  });
  cols.push("  _storedAt TEXT");

  const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n${cols.join(",\n")}\n)`;

  if (runtime === "bun") {
    db.run(sql);
  } else {
    db.prepare(sql).run();
  }
}

function insertRecord(db: any, schema: StoreSchema, record: Record<string, any>, runtime: "bun" | "node"): void {
  const tableName = schema.name.replace(/[^a-zA-Z0-9_]/g, "_");
  const fields = [...Object.keys(schema.fields), "_storedAt"];
  const values = fields.map(f => {
    if (f === "_storedAt") return new Date().toISOString();
    const v = record[f];
    // Serialize objects/arrays as JSON strings for SQLite
    if (v !== null && (typeof v === "object" || Array.isArray(v))) return JSON.stringify(v);
    return v ?? null;
  });

  const placeholders = runtime === "bun"
    ? fields.map((_, i) => `?${i + 1}`).join(", ")
    : fields.map(() => "?").join(", ");

  const sql = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders})`;

  if (runtime === "bun") {
    db.run(sql, values);
  } else {
    db.prepare(sql).run(values);
  }
}

// ── Main store function ───────────────────────────────────────────────────────

export async function storeRecord(
  storeName: string,
  data: Record<string, any> | Record<string, any>[]
): Promise<{ stored: number; skipped: number }> {
  const schema = getSchema(storeName);

  if (!schema) {
    logger.warn(`[store] no schema found for "${storeName}" in piggy.store.json — data not stored`);
    return { stored: 0, skipped: 1 };
  }

  const records = Array.isArray(data) ? data : [data];
  let stored = 0;
  let skipped = 0;

  const isJson = schema.destination.endsWith(".json");
  const isSqlite = schema.destination.endsWith(".db") || schema.destination.endsWith(".sqlite");

  for (const record of records) {
    try {
      const shaped = shapeRecord(record, schema);

      if (isJson) {
        appendToJson(schema.destination, shaped);
      } else if (isSqlite) {
        appendToSqlite(schema.destination, shaped, schema);
      } else {
        logger.error(`[store] unsupported destination format: ${schema.destination} (use .json or .db)`);
        skipped++;
        continue;
      }

      stored++;
      logger.success(`[store][${storeName}] stored record → ${schema.destination}`);
    } catch (e: any) {
      logger.error(`[store][${storeName}] failed to store record: ${e.message}`);
      skipped++;
    }
  }

  return { stored, skipped };
}