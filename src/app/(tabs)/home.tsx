import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { RecipeSection } from "@/components/recipes/recipe-section";
import { ScreenHeader } from "@/components/screen-header";
import { getExperienceLevelName } from "@/constants/experience-levels";
import { useHomeFeeds } from "@/hooks/use-home-feeds";
import { useAuthContext } from "@/lib/auth/auth-context";
import { updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { incrementPostViews, likePost, unlikePost } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE } from "@/services/api/profiles";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
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

function HomeScreen() {
  const [openRecipe, setOpenRecipe] = useState<RecipeCardData | null>(null);
  const { homeFeeds, setHomeFeeds, feedsLoading, likedPostIds, setLikedPostIds, refreshing, refreshHomeFeeds } = useHomeFeeds();
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<string>>(new Set());
  const { currentUser } = useAuthContext();
  const username = currentUser?.username?.trim() || currentUser?.email.split("@")[0] || "there";
  const experienceLevel = getExperienceLevelName(currentUser?.experience_level ?? currentUser?.experienceLevel) ?? "Home Cook";
  const streakCount = Number(currentUser?.streakCount ?? currentUser?.streakcount ?? 0);
  const loggedDays = getLoggedDays(streakCount, currentUser?.last_streak_post ?? currentUser?.last_post_at);

  const handleOpenRecipe = (recipe: RecipeCardData) => {
    setOpenRecipe(recipe);
    void incrementPostViews(recipe.id)
      .then(() => {
        setHomeFeeds((previous) => ({
          recommended: previous.recommended.map((item) => item.id === recipe.id ? updateRecipeCardData(item, { views: item.views + 1 }) : item),
          easyWins: previous.easyWins.map((item) => item.id === recipe.id ? updateRecipeCardData(item, { views: item.views + 1 }) : item),
          challenge: previous.challenge.map((item) => item.id === recipe.id ? updateRecipeCardData(item, { views: item.views + 1 }) : item),
          friends: previous.friends.map((item) => item.id === recipe.id ? updateRecipeCardData(item, { views: item.views + 1 }) : item),
        }));
        setOpenRecipe((previous) => previous?.id === recipe.id
          ? updateRecipeCardData(previous, { views: previous.views + 1 })
          : previous);
      })
      .catch((error) => console.error("Unable to increment views for post:", error));
  };

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    if (!currentUser) throw new Error("Please sign in to like this recipe.");

    setLikeLoadingIds((previous) => new Set(previous).add(postId));
    try {
      if (currentlyLiked) await unlikePost(postId);
      else await likePost(postId);

      setLikedPostIds((previous) => {
        const next = new Set(previous);
        if (currentlyLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      const likesChange = currentlyLiked ? -1 : 1;
      setHomeFeeds((previous) => ({
        recommended: previous.recommended.map((recipe) => recipe.id === postId ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) }) : recipe),
        easyWins: previous.easyWins.map((recipe) => recipe.id === postId ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) }) : recipe),
        challenge: previous.challenge.map((recipe) => recipe.id === postId ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) }) : recipe),
        friends: previous.friends.map((recipe) => recipe.id === postId ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) }) : recipe),
      }));
      setOpenRecipe((previous) => previous?.id === postId
        ? updateRecipeCardData(previous, { likes: Math.max(0, previous.likes + likesChange) })
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
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={Platform.OS === "web" ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refreshHomeFeeds} tintColor={colors.sage} colors={[colors.sage]} />
      )}
    >
      <ScreenHeader
        eyebrow="Good morning"
        title={`Hey, ${username}.`}
        subtitle="A little progress tastes good."
        action={(
          <View style={{ marginLeft: 12, alignItems: "center" }}>
            <View style={styles.avatar}>
              <Image source={{ uri: currentUser?.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.fill} />
            </View>
            <View style={styles.avatarBadge}>
              <Text numberOfLines={1} style={styles.avatarBadgeText}>{experienceLevel}</Text>
            </View>
          </View>
        )}
      />

      {/* STREAK CARD */}
      <View style={[styles.streakCard, shadowSm]}>
        <View style={styles.streakContent}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={styles.streakTitle}>{streakCount} <Text style={styles.streakDays}>day streak</Text></Text>
            </View>
            <Text style={[styles.sectionSub, styles.streakSubtitle]}>Keep your cooking rhythm going.</Text>
          </View>
          <View style={styles.streakDaysRow}>
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
      </View>

      {/* RECIPE SECTIONS */}
      <RecipeSection icon="🔥" title="Recommended for you" subtitle="Hand-picked matches for your level" recipes={homeFeeds.recommended} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={(recipe) => recipe.post?.profile_id && router.push(`/profile/${recipe.post.profile_id}`)} />
      <RecipeSection icon="⚡" title="Easy wins" subtitle="Under 20 minutes, no fuss" recipes={homeFeeds.easyWins} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={(recipe) => recipe.post?.profile_id && router.push(`/profile/${recipe.post.profile_id}`)} />
      <RecipeSection icon="🏆" title="Challenge yourself" subtitle="Push your skills further" recipes={homeFeeds.challenge} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={(recipe) => recipe.post?.profile_id && router.push(`/profile/${recipe.post.profile_id}`)} />
      <RecipeSection icon="👥" title="From your friends" subtitle="What the community cooked this week" recipes={homeFeeds.friends} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={(recipe) => recipe.post?.profile_id && router.push(`/profile/${recipe.post.profile_id}`)} />
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
      onLike={(currentlyLiked) => openRecipe ? handleLikePost(openRecipe.id, currentlyLiked) : Promise.resolve()}
      onAuthorPress={openRecipe?.post?.profile_id ? () => router.push(`/profile/${openRecipe.post.profile_id}`) : undefined}
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
  streakContent: { flexDirection: Platform.OS === "web" ? "row" : "column", alignItems: Platform.OS === "web" ? "center" : "stretch", gap: 12 },
  streakTitle: { fontFamily: fonts.heading, fontSize: Platform.OS === "web" ? 30 : 24, color: colors.ink },
  streakDays: { fontFamily: fonts.heading, fontSize: Platform.OS === "web" ? 22 : 18, color: colors.muted },
  streakSubtitle: { marginTop: 2, display: Platform.OS === "web" ? "none" : "flex" },
  streakDaysRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: Platform.OS === "web" ? 1 : undefined, marginLeft: Platform.OS === "web" ? 24 : 0 },
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