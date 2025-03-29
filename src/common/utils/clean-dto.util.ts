export function pick<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key of keys) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}
