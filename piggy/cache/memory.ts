// piggy/cache/memory.ts

interface CacheEntry {
  data: any;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export function get(key: string): any | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function set(key: string, data: any, ttlMs: number) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function del(key: string) {
  store.delete(key);
}

export function clear() {
  store.clear();
}

export function size() {
  return store.size;
}

export function keys() {
  return Array.from(store.keys());
}