const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** How a message's time reads in the list: the time today, the day this year, the full date before. */
export function shortDate(iso: string, language: string) {
  const date = new Date(iso);
  const now = new Date();
  if (startOfDay(date) === startOfDay(now))
    return date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
  if (date.getFullYear() === now.getFullYear())
    return date.toLocaleDateString(language, { month: "short", day: "numeric" });
  return date.toLocaleDateString(language);
}

export const longDate = (iso: string, language: string) =>
  new Date(iso).toLocaleString(language, { dateStyle: "medium", timeStyle: "short" });

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
