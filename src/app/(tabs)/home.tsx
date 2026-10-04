import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { getExperienceLevelName } from "@/constants/experience-levels";
import { useAuthContext } from "@/lib/auth/auth-context";
import { fetchHomePostSections, getLikedPostsByUser, incrementPostViews, likePost } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE } from "@/services/api/profiles";
import type { Post } from "@/types/models";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadowSm } from "./theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getLoggedDays(streakCount: number, lastStreakPost?: Date | string | null) {
  const dateOnlyMatch = typeof lastStreakPost === "string"
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastStreakPost)
    : null;
  const lastPost = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : lastStreakPost ? new Date(lastStreakPost) : null;

  if (!lastPost || Number.isNaN(lastPost.getTime()) || !Number.isFinite(streakCount) || streakCount <= 0) {
    return DAYS.map(() => false);
  }

  const lastPostWeekday = (lastPost.getDay() + 6) % 7;
  return DAYS.map((_, index) => {
    const daysBeforeLastPost = (lastPostWeekday - index + DAYS.length) % DAYS.length;
    return daysBeforeLastPost >= 0 && daysBeforeLastPost < streakCount;
  });
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
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
};

interface Recipe {
  post: Post;
  id: string;
  title: string;
  difficulty: string;
  time?: string;
  img: string;
  likes: number;
  views: number;
  friend?: string;
}

type HomeFeeds = {
  recommended: Recipe[];
  easyWins: Recipe[];
  challenge: Recipe[];
  friends: Recipe[];
};

const EMPTY_HOME_FEEDS: HomeFeeds = {
  recommended: [],
  easyWins: [],
  challenge: [],
  friends: [],
};

function toHomeRecipe(post: Post, showAuthor = false): Recipe {
  const fields = post as Post & {
    like_count?: number | string | null;
    likes_count?: number | string | null;
    view_count?: number | string | null;
    cooking_time?: number | string | null;
    cooking_minutes?: number | string | null;
    cook_time?: number | string | null;
    prep_time?: number | string | null;
    total_time?: number | string | null;
    time?: number | string | null;
  };
  const difficultyValue = Number(post.difficulty) || 1;
  const recipeTime = post.recipe && typeof post.recipe === "object" ? post.recipe.time : undefined;
  const cookingTime = formatCookingTime(fields.time ?? fields.cooking_time ?? fields.cooking_minutes ?? fields.cook_time ?? fields.prep_time ?? fields.total_time ?? recipeTime);

  return {
    post,
    id: post.id,
    title: post.title || "Untitled recipe",
    difficulty: getExperienceLevelName(difficultyValue) ?? `Level ${difficultyValue}`,
    time: cookingTime,
    img: post.image_url || "",
    likes: Number(fields.likes ?? fields.like_count ?? fields.likes_count) || 0,
    views: Number(fields.views ?? fields.view_count) || 0,
    friend: showAuthor ? post.author_username || "Community cook" : undefined,
  };
}

function formatCookingTime(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const text = String(value).trim();
  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) {
    return numericValue > 0 ? `${numericValue} min` : undefined;
  }

  const clockTime = /^(\d+):([0-5]\d)(?::[0-5]\d)?$/.exec(text);
  if (clockTime) {
    const totalMinutes = Number(clockTime[1]) * 60 + Number(clockTime[2]);
    return totalMinutes > 0 ? `${totalMinutes} min` : undefined;
  }

  return text;
}

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: (recipe: Recipe) => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const diff = DIFFICULTY_COLORS[recipe.difficulty] ?? DIFFICULTY_COLORS["Beginner Cook"];
  return (
    <Pressable
      onPress={() => onOpen(recipe)}
      style={({ pressed }) => [styles.recipeCard, shadowSm, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.recipeImgWrap}>
        {recipe.img && !imageFailed ? (
          <Image source={{ uri: recipe.img }} style={styles.fill} resizeMode="cover" onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.fill, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>Image unavailable</Text>
          </View>
        )}
        {recipe.friend && (
          <View style={styles.friendTag}>
            <Text style={styles.friendTagText}>{recipe.friend}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={2} style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.rowBetween}>
          <View style={[styles.pill, { backgroundColor: diff.bg }]}>
            <Text numberOfLines={1} style={[styles.pillText, { color: diff.text }]}>{recipe.difficulty}</Text>
          </View>
          {recipe.time ? <Text style={styles.recipeTime}>{recipe.time}</Text> : null}
        </View>
        <View style={styles.recipeStats}>
          <Text accessibilityLabel={`${recipe.likes} likes`} style={styles.recipeStat}>♥ {formatCount(recipe.likes)} {recipe.likes === 1 ? "like" : "likes"}</Text>
          <Text accessibilityLabel={`${recipe.views} views`} style={styles.recipeStat}>◉ {formatCount(recipe.views)} {recipe.views === 1 ? "view" : "views"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RecipeSection({
  icon, title, subtitle, recipes, loading, onOpen,
}: { icon: string; title: string; subtitle: string; recipes: Recipe[]; loading: boolean; onOpen: (recipe: Recipe) => void }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.sectionHead}>
        <Text style={{ fontSize: 20, marginTop: 2 }}>{icon}</Text>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.sage} style={{ height: 150 }} />
      ) : recipes.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 12 }}
        >
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptySection}>No recipes to show yet.</Text>
      )}
    </View>
  );
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function HomeScreen() {
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [homeFeeds, setHomeFeeds] = useState<HomeFeeds>(EMPTY_HOME_FEEDS);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<string>>(new Set());
  const { currentUser } = useAuthContext();
  const username = currentUser?.username?.trim() || currentUser?.email.split("@")[0] || "there";
  const experienceLevel = getExperienceLevelName(currentUser?.experience_level ?? currentUser?.experienceLevel) ?? "Home Cook";
  const streakCount = Number(currentUser?.streakCount ?? currentUser?.streakcount ?? 0);
  const loggedDays = getLoggedDays(streakCount, currentUser?.last_streak_post ?? currentUser?.last_post_at);

  useEffect(() => {
    let isActive = true;

    async function loadHomeFeeds() {
      setFeedsLoading(true);
      try {
        const [feeds, likedPosts] = await Promise.all([
          fetchHomePostSections(),
          getLikedPostsByUser(),
        ]);

        if (isActive) {
          setHomeFeeds({
            recommended: feeds.recommended.map((post) => toHomeRecipe(post)),
            easyWins: feeds.easyWins.map((post) => toHomeRecipe(post)),
            challenge: feeds.challenge.map((post) => toHomeRecipe(post)),
            friends: feeds.friends.map((post) => toHomeRecipe(post, true)),
          });
          setLikedPostIds(new Set(likedPosts.map((post) => post.id)));
        }
      } catch (error) {
        console.error("Error loading home feeds:", error);
        if (isActive) setHomeFeeds(EMPTY_HOME_FEEDS);
      } finally {
        if (isActive) setFeedsLoading(false);
      }
    }

    void loadHomeFeeds();
    return () => {
      isActive = false;
    };
  }, []);

  const handleOpenRecipe = (recipe: Recipe) => {
    setOpenRecipe(recipe);
    void incrementPostViews(recipe.id)
      .then(() => {
        setHomeFeeds((previous) => Object.fromEntries(
          Object.entries(previous).map(([section, recipes]) => [
            section,
            recipes.map((item) => item.id === recipe.id ? { ...item, views: item.views + 1, post: { ...item.post, views: item.views + 1 } } : item),
          ]),
        ) as HomeFeeds);
        setOpenRecipe((previous) => previous?.id === recipe.id
          ? { ...previous, views: previous.views + 1, post: { ...previous.post, views: previous.views + 1 } }
          : previous);
      })
      .catch((error) => console.error("Unable to increment views for post:", error));
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) throw new Error("Please sign in to like this recipe.");
    if (likedPostIds.has(postId)) return;

    setLikeLoadingIds((previous) => new Set(previous).add(postId));
    try {
      await likePost(postId);
      setLikedPostIds((previous) => new Set(previous).add(postId));
      setHomeFeeds((previous) => Object.fromEntries(
        Object.entries(previous).map(([section, recipes]) => [
          section,
          recipes.map((recipe) => recipe.id === postId ? { ...recipe, likes: recipe.likes + 1, post: { ...recipe.post, likes: recipe.likes + 1 } } : recipe),
        ]),
      ) as HomeFeeds);
      setOpenRecipe((previous) => previous?.id === postId
        ? { ...previous, likes: previous.likes + 1, post: { ...previous.post, likes: previous.likes + 1 } }
        : previous);
    } finally {
      setLikeLoadingIds((previous) => {
        const next = new Set(previous);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* HEADER */}
      <View style={styles.homeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Good morning</Text>
          <Text style={styles.h1}>Hey, {username}.</Text>
          <Text style={styles.subtitle}>A little progress tastes good.</Text>
        </View>
        <View style={{ marginLeft: 12, alignItems: "center" }}>
          <View style={styles.avatar}>
            <Image
              source={{ uri: currentUser?.pfp_url || DEFAULT_PROFILE_IMAGE }}
              style={styles.fill}
            />
          </View>
          <View style={styles.avatarBadge}>
            <Text numberOfLines={1} style={styles.avatarBadgeText}>{experienceLevel}</Text>
          </View>
        </View>
      </View>

      {/* STREAK CARD */}
      <View style={[styles.streakCard, shadowSm]}>
        <View style={{ marginBottom: 12 }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={styles.streakTitle}>{streakCount}-day streak</Text>
            </View>
            <Text style={[styles.sectionSub, { marginTop: 2 }]}>Keep your cooking rhythm going.</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          {DAYS.map((day, i) => {
            const active = loggedDays[i];
            return (
              <View key={i} style={{ alignItems: "center", gap: 4 }}>
                <View style={[styles.dayDot, { backgroundColor: active ? colors.terracotta : colors.divider }]}>
                  {active ? (
                    <Text style={{ fontSize: 14 }}>🔥</Text>
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ghost }}>{day}</Text>
                  )}
                </View>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* RECIPE SECTIONS */}
      <RecipeSection icon="🔥" title="Recommended for you" subtitle="Hand-picked matches for your level" recipes={homeFeeds.recommended} loading={feedsLoading} onOpen={handleOpenRecipe} />
      <RecipeSection icon="⚡" title="Easy wins" subtitle="Under 20 minutes, no fuss" recipes={homeFeeds.easyWins} loading={feedsLoading} onOpen={handleOpenRecipe} />
      <RecipeSection icon="🏆" title="Challenge yourself" subtitle="Push your skills further" recipes={homeFeeds.challenge} loading={feedsLoading} onOpen={handleOpenRecipe} />
      <RecipeSection icon="👥" title="From your friends" subtitle="What the community cooked this week" recipes={homeFeeds.friends} loading={feedsLoading} onOpen={handleOpenRecipe} />
    </ScrollView>
    <RecipeDetailsModal
      post={openRecipe?.post ?? null}
      visible={openRecipe !== null}
      difficulty={openRecipe?.difficulty ?? ""}
      cookingTime={openRecipe?.time}
      likes={openRecipe?.likes ?? 0}
      views={openRecipe?.views ?? 0}
      liked={openRecipe ? likedPostIds.has(openRecipe.id) : false}
      likeLoading={openRecipe ? likeLoadingIds.has(openRecipe.id) : false}
      onClose={() => setOpenRecipe(null)}
      onLike={() => openRecipe ? handleLikePost(openRecipe.id) : Promise.resolve()}
    />
    </>
  );
}

export default function HomeScreenRoute() {
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Home header
  homeHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 },
  eyebrow: { fontSize: 12, fontWeight: "600", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  h1: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", borderWidth: 2, borderColor: colors.clay, backgroundColor: colors.sageLight },
  avatarBadge: { maxWidth: 136, marginTop: 6, backgroundColor: colors.sage, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  avatarBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800", textAlign: "center" },
  // Streak
  streakCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  streakTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink },
  dayDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayLabel: { fontSize: 9, fontWeight: "600", color: colors.faint, textTransform: "uppercase" },

  // Sections / cards
  sectionHead: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.ink },
  sectionSub: { fontSize: 12, fontWeight: "500", color: colors.muted, marginTop: 2 },
  recipeCard: { width: 176, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  recipeImgWrap: { height: 112, backgroundColor: colors.sageLight, overflow: "hidden" },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.sageLight },
  imageFallbackText: { fontSize: 10, fontWeight: "500", color: colors.muted },
  friendTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  friendTagText: { fontSize: 10, fontWeight: "600", color: colors.ink },
  recipeTitle: { fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 15, marginBottom: 6 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: "600" },
  recipeTime: { fontSize: 10, fontWeight: "500", color: colors.muted },
  recipeStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  recipeStat: { fontSize: 9, fontWeight: "600", color: colors.muted },
  emptySection: { paddingHorizontal: 16, paddingVertical: 20, fontSize: 12, fontWeight: "500", color: colors.muted },

});