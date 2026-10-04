export const EXPERIENCE_LEVEL_NAMES = [
  "Absolute Beginner",
  "Novice",
  "Beginner Cook",
  "Advanced Beginner",
  "Intermediate Cook",
  "Capable Cook",
  "Advanced Intermediate",
  "Experienced Cook",
  "Advanced Cook",
  "Expert Chef",
] as const;

export type ExperienceLevelName = (typeof EXPERIENCE_LEVEL_NAMES)[number];

export function getExperienceLevelName(level: number | null | undefined): ExperienceLevelName | null {
  if (!Number.isInteger(level) || level === undefined || level === null || level < 1 || level > EXPERIENCE_LEVEL_NAMES.length) {
    return null;
  }

  return EXPERIENCE_LEVEL_NAMES[level - 1];
}