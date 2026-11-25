const locale =
  typeof navigator !== "undefined"
    ? navigator.languages?.[0] ?? navigator.language ?? "en-US"
    : "en-US";

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
