// piggy/cache/memory.js

const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function set(key, data, ttlMs) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function del(key) {
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