import type { WorkExperience } from "@/src/demo/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const AVG_MONTH_DAYS = 30.4375;

function parseDate(value: string, fallback?: Date) {
  if (!value) return fallback || null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export function experienceMonths(
  entries: WorkExperience[] | undefined,
  verifiedOnly = false,
) {
  const now = new Date();
  const ranges = (entries || [])
    .filter((entry) => !verifiedOnly || entry.status === "verified")
    .map((entry) => {
      const start = parseDate(entry.start_date);
      const end = entry.current ? now : parseDate(entry.end_date, now);
      if (!start || !end || end < start) return null;
      return [start.getTime(), end.getTime()] as const;
    })
    .filter((range): range is readonly [number, number] => Boolean(range))
    .sort((a, b) => a[0] - b[0]);

  if (!ranges.length) return 0;

  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }

  const days = merged.reduce(
    (sum, [start, end]) => sum + Math.max(0, (end - start) / DAY_MS),
    0,
  );
  return Math.round((days / AVG_MONTH_DAYS) * 10) / 10;
}

export function experienceYears(entries: WorkExperience[] | undefined) {
  return Math.round((experienceMonths(entries) / 12) * 10) / 10;
}

export function verifiedExperienceHours(entries: WorkExperience[] | undefined) {
  return Math.round(
    (entries || [])
      .filter((entry) => entry.status === "verified")
      .reduce((sum, entry) => sum + (entry.hours || 0), 0),
  );
}
