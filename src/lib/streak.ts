const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a date-only string ("2026-10-13") as a local date, anything else via Date. */
function toLocalDay(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const dateOnly = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * The streak that is actually still alive: the stored count only counts if the
 * last streak post was today or yesterday, otherwise the streak has lapsed.
 */
export function getActiveStreak(streakCount: unknown, lastStreakPost: Date | string | null | undefined): number {
  const count = Number(streakCount);
  if (!Number.isFinite(count) || count <= 0) return 0;
  const lastPost = toLocalDay(lastStreakPost);
  // Without a date we can't tell whether it lapsed, so trust the stored count.
  if (!lastPost) return Math.floor(count);
  return daysBetween(lastPost, startOfToday()) <= 1 ? Math.floor(count) : 0;
}

/**
 * Which days of the current Monday-to-Sunday week fall inside the active streak.
 * Only days on or before the last streak post (and never in the future) are marked.
 */
export function getStreakWeekDays(streakCount: unknown, lastStreakPost: Date | string | null | undefined): boolean[] {
  const activeStreak = getActiveStreak(streakCount, lastStreakPost);
  const lastPost = toLocalDay(lastStreakPost);
  const today = startOfToday();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    if (activeStreak <= 0 || !lastPost) return false;
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const daysBeforeLastPost = daysBetween(day, lastPost);
    return daysBeforeLastPost >= 0 && daysBeforeLastPost < activeStreak;
  });
}

/** Index (0 = Monday) of today within the current week. */
export function getTodayWeekIndex() {
  return (new Date().getDay() + 6) % 7;
}
