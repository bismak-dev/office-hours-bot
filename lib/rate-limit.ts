// SEC-022 per-student limits. Without real sign-in, a "student" is the typed name.
// Counts live in server memory, so they reset whenever the server restarts.
export const MAX_PER_MINUTE = 10;
export const MAX_PER_DAY = 40;
export const COURSE_TIME_ZONE = "America/New_York";

type Usage = { recent: number[]; day: string; dayCount: number };

const globalStore = globalThis as unknown as { officeHoursUsage?: Map<string, Usage> };
const usage = (globalStore.officeHoursUsage ??= new Map<string, Usage>());

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: COURSE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type LimitResult = { allowed: true } | { allowed: false; error: string };

// Checks the limits and, if the question is allowed, counts it. Refused questions are not counted.
export function checkRateLimit(name: string): LimitResult {
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  const now = Date.now();
  const today = dayFormat.format(now);

  let entry = usage.get(key);
  if (!entry || entry.day !== today) {
    entry = { recent: entry?.recent ?? [], day: today, dayCount: 0 };
    usage.set(key, entry);
  }
  entry.recent = entry.recent.filter((t) => now - t < 60_000);

  if (entry.dayCount >= MAX_PER_DAY) {
    return {
      allowed: false,
      error:
        `You've reached the limit of ${MAX_PER_DAY} questions for today. You can ask again after midnight (US Eastern time). ` +
        "For help before then, come to office hours: Tuesdays 2:00-4:00 pm in Room 210.",
    };
  }
  if (entry.recent.length >= MAX_PER_MINUTE) {
    return {
      allowed: false,
      error: `You're asking questions too quickly (limit: ${MAX_PER_MINUTE} per minute). Please wait a minute and try again.`,
    };
  }

  entry.recent.push(now);
  entry.dayCount += 1;
  return { allowed: true };
}
