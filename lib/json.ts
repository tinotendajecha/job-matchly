// lib/json.ts
export function toJsonValue<T>(val: T): any {
  // Ensures class instances / Maps / BigInt etc. are converted to JSON-safe structures
  return JSON.parse(
    JSON.stringify(val, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}
