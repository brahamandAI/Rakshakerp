/** Humanize camelCase / snake_case keys for review UIs. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Flatten nested objects into labeled rows so review UIs never show "[object Object]".
 * e.g. { present: { village: "X" } } → [["present village", "X"]]
 */
export function flattenDisplayEntries(
  data: Record<string, unknown>,
  prefix = ""
): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;

    const label = prefix ? `${prefix} ${key}` : key;

    if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
      out.push([label, value]);
      continue;
    }

    if (value instanceof Date) {
      out.push([label, value]);
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      const allPrimitive = value.every(
        (v) =>
          v === null ||
          v === undefined ||
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
      );
      if (allPrimitive) {
        out.push([label, value.filter((v) => v != null && v !== "").join(", ")]);
      } else {
        value.forEach((item, index) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            out.push(
              ...flattenDisplayEntries(
                item as Record<string, unknown>,
                `${label} ${index + 1}`
              )
            );
          } else if (item !== undefined && item !== null && item !== "") {
            out.push([`${label} ${index + 1}`, item]);
          }
        });
      }
      continue;
    }

    if (typeof value === "object") {
      out.push(
        ...flattenDisplayEntries(value as Record<string, unknown>, label)
      );
      continue;
    }

    out.push([label, value]);
  }

  return out;
}

export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) {
    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (typeof value === "object") {
    const entries = flattenDisplayEntries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";
    return entries
      .map(([k, v]) => `${humanizeKey(k)}: ${formatDisplayValue(v)}`)
      .join("; ");
  }
  return String(value);
}
