// piggy/cache/memory.ts
var store = new Map;
function get(key) {
  const entry = store.get(key);
  if (!entry)
    return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}
function set(key, data, ttlMs) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}
function del(key) {
  store.delete(key);
}
function clear() {
  store.clear();
}
function size() {
  return store.size;
}
function keys() {
  return Array.from(store.keys());
}
export {
  size,
  set,
  keys,
  get,
  del,
  clear
};
