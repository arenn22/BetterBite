import { getExperienceLevelName } from "@/constants/experience-levels";
import type { Post } from "@/types/models";

export type RecipeCardData = {
  id: string;
  title: string;
  difficulty: string;
  time?: string;
  imageUrl: string;
  likes: number;
  views: number;
  author?: string;
  post?: Post;
};

export const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  "Absolute Beginner": { bg: "#E8EDE5", text: "#687B5D" },
  Novice: { bg: "#E8EDE5", text: "#687B5D" },
  "Beginner Cook": { bg: "#E8EDE5", text: "#687B5D" },
  "Advanced Beginner": { bg: "#E8EDE5", text: "#687B5D" },
  "Intermediate Cook": { bg: "#FDF0EA", text: "#C4855F" },
  "Capable Cook": { bg: "#FDF0EA", text: "#C4855F" },
  "Advanced Intermediate": { bg: "#FCE4D6", text: "#B5603A" },
  "Experienced Cook": { bg: "#FCE4D6", text: "#B5603A" },
  "Advanced Cook": { bg: "#F8DDD0", text: "#9B3A1A" },
  "Expert Chef": { bg: "#F8DDD0", text: "#9B3A1A" },
  Easy: { bg: "#E8EDE5", text: "#687B5D" },
  Medium: { bg: "#FDF0EA", text: "#C4855F" },
  Hard: { bg: "#F8DDD0", text: "#9B3A1A" },
};

export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

export function formatCookingTime(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const text = String(value).trim();
  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) return numericValue > 0 ? `${numericValue} min` : undefined;

  const clockTime = /^(\d+):([0-5]\d)(?::[0-5]\d)?$/.exec(text);
  if (!clockTime) return text;

  const totalMinutes = Number(clockTime[1]) * 60 + Number(clockTime[2]);
  return totalMinutes > 0 ? `${totalMinutes} min` : undefined;
}

export function toRecipeCardData(post: Post, showAuthor = false): RecipeCardData {
  const fields = post as Post & {
    like_count?: number | string | null;
    likes_count?: number | string | null;
    view_count?: number | string | null;
    cooking_time?: number | string | null;
    cooking_minutes?: number | string | null;
    cook_time?: number | string | null;
    prep_time?: number | string | null;
    total_time?: number | string | null;
  };
  const difficultyValue = Number(post.difficulty) || 1;
  const recipeTime = post.recipe && typeof post.recipe === "object" ? post.recipe.time : undefined;

  return {
    id: post.id,
    title: post.title || "Untitled recipe",
    difficulty: getExperienceLevelName(difficultyValue) ?? `Level ${difficultyValue}`,
    time: formatCookingTime(fields.time ?? fields.cooking_time ?? fields.cooking_minutes ?? fields.cook_time ?? fields.prep_time ?? fields.total_time ?? recipeTime),
    imageUrl: post.image_url || "",
    likes: Number(fields.likes ?? fields.like_count ?? fields.likes_count) || 0,
    views: Number(fields.views ?? fields.view_count) || 0,
    author: showAuthor ? post.author_username || "Community cook" : undefined,
    post,
  };
}

export function updateRecipeCardData(
  recipe: RecipeCardData,
  changes: Partial<Pick<RecipeCardData, "likes" | "views">>,
): RecipeCardData {
  return {
    ...recipe,
    ...changes,
    post: recipe.post
      ? { ...recipe.post, ...changes }
      : undefined,
  };
}
