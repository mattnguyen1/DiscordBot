export class MemoryRedis {
  isReady = true;
  isOpen = true;
  private hashes = new Map<string, Map<string, string>>();
  private lists = new Map<string, string[]>();

  async connect() { this.isReady = true; this.isOpen = true; }
  async quit() { this.isReady = false; this.isOpen = false; }
  on() { return this; }

  async hSet(key: string, field: string, value: string) {
    const hash = this.hashes.get(key) || new Map<string, string>();
    hash.set(field, value);
    this.hashes.set(key, hash);
    return 1;
  }

  async hGet(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hGetAll(key: string) {
    return Object.fromEntries(this.hashes.get(key) || []);
  }

  async hDel(key: string, field: string) {
    return this.hashes.get(key)?.delete(field) ? 1 : 0;
  }

  async del(key: string) {
    const existed = this.hashes.delete(key) || this.lists.delete(key);
    return existed ? 1 : 0;
  }

  async lPush(key: string, value: string) {
    const list = this.lists.get(key) || [];
    list.unshift(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lRange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async lSet(key: string, index: number, value: string) {
    const list = this.lists.get(key) || [];
    if (index < 0 || index >= list.length) throw new Error("ERR index out of range");
    list[index] = value;
    return "OK";
  }

  async lRem(key: string, count: number, value: string) {
    const list = this.lists.get(key) || [];
    let removed = 0;
    const next = list.filter((item) => {
      if ((count === 0 || removed < count) && item === value) {
        removed += 1;
        return false;
      }
      return true;
    });
    this.lists.set(key, next);
    return removed;
  }
}
