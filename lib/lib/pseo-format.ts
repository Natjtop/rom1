export function cleanPseoText(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePseoContent<T>(value: T): T {
  if (typeof value === "string") {
    return cleanPseoText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizePseoContent(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        normalizePseoContent(entry),
      ])
    ) as T;
  }

  return value;
}
