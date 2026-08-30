export function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("ru-RU");
}

/** 84000 → «84 тыс.», 1 250 000 → «1,3 млн» */
export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  if (value >= 1_000) return `${Math.round(value / 1000)} тыс.`;
  return String(value);
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("ru-RU")} ₸`;
}

export function priceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return "—";
  if (min !== null && max !== null && min !== max) return `${money(min)} — ${money(max)}`;
  return money(min ?? max);
}

export function date(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
