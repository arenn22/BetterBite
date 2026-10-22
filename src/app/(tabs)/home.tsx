import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { RecipeSection } from "@/components/recipes/recipe-section";
import { ScreenHeader } from "@/components/screen-header";
import { getExperienceLevelName } from "@/constants/experience-levels";
import { useHomeFeeds } from "@/hooks/use-home-feeds";
import { useAuthContext } from "@/lib/auth/auth-context";
import { updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { incrementPostViews, likePost, unlikePost } from "@/services/api/posts";
import { getActiveStreak, getStreakWeekDays, getTodayWeekIndex } from "@/lib/streak";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { FadeIn } from "@/components/ui/fade-in";
import { AppIcon } from "@/components/ui/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { colors, fonts, layout, radii, shadowSm } from "./theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function HomeScreen() {
  const [openRecipe, setOpenRecipe] = useState<RecipeCardData | null>(null);
  const { homeFeeds, setHomeFeeds, feedsLoading, likedPostIds, setLikedPostIds, refreshing, refreshHomeFeeds } = useHomeFeeds();
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<string>>(new Set());
  const { currentUser, refreshCurrentUser } = useAuthContext();
  const experienceLevel = getExperienceLevelName(currentUser?.experience_level ?? currentUser?.experienceLevel) ?? "Home Cook";
  const lastStreakPost = currentUser?.last_streak_post ?? currentUser?.last_post_at;
  const streakCount = getActiveStreak(currentUser?.streakCount ?? currentUser?.streakcount, lastStreakPost);
  const loggedDays = getStreakWeekDays(currentUser?.streakCount ?? currentUser?.streakcount, lastStreakPost);
  const todayIndex = getTodayWeekIndex();
  const postedToday = loggedDays[todayIndex];

  // Pull the latest streak from the server whenever Home comes back into view
  // (e.g. after publishing a recipe or sharing a cook).
  useFocusEffect(
    useCallback(() => {
      void refreshCurrentUser().catch((error) => console.error("Unable to refresh streak:", error));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id]),
  );

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

  const openAuthor = (recipe: RecipeCardData) => {
    if (recipe.post?.profile_id) router.push(`/profile/${recipe.post.profile_id}`);
  };
  const openRecipeAuthorId = openRecipe?.post?.profile_id;

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 80 }}
      refreshControl={Platform.OS === "web" ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={() => { refreshHomeFeeds(); void refreshCurrentUser().catch(() => {}); }} tintColor={colors.sage} colors={[colors.sage]} />
      )}
    >
      <ScreenHeader
        title="Home"
        action={(
          <View style={styles.profileAction}>
            <View style={styles.avatar}>
              {currentUser?.pfp_url ? (
                <Image source={{ uri: currentUser.pfp_url }} style={styles.fill} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(currentUser?.username?.[0] ?? "B").toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Text numberOfLines={1} style={styles.avatarBadgeText}>{experienceLevel}</Text>
            </View>
          </View>
        )}
      />

      {/* STREAK CARD */}
      <FadeIn delay={80} style={[styles.streakCard, shadowSm]}>
        <View style={styles.streakContent}>
          <View style={styles.streakHeader}>
            <IconBadge name="flame" size={44} color={colors.sage} backgroundColor={colors.sageLight} />
            <View style={styles.streakCopy}>
              <Text style={styles.streakTitle}>{streakCount} <Text style={styles.streakDays}>day streak</Text></Text>
              <Text style={styles.streakSubtitle}>
                {postedToday
                  ? "You've cooked today. Nice work!"
                  : streakCount > 0
                    ? "Share a recipe today to keep it going."
                    : "Share a recipe to start a new streak."}
              </Text>
            </View>
          </View>
          <View style={styles.streakDaysRow}>
          {DAYS.map((day, i) => {
            const active = loggedDays[i];
            const isToday = i === todayIndex;
            return (
              <View key={i} style={styles.dayColumn}>
                {active ? (
                  <Animated.View entering={ZoomIn.delay(120 + i * 40).duration(220)} style={[styles.dayDot, styles.dayDotActive]}>
                    <AppIcon name="flame" size={16} color="#FFFFFF" weight="semibold" />
                  </Animated.View>
                ) : (
                  <View style={[styles.dayDot, isToday && styles.dayDotToday, i > todayIndex && styles.dayDotFuture]} />
                )}
                <Text style={[styles.dayLabel, active && styles.dayLabelActive, isToday && styles.dayLabelToday]}>{isToday ? "Today" : day}</Text>
              </View>
            );
          })}
          </View>
        </View>
      </FadeIn>

      {/* RECIPE SECTIONS */}
      <RecipeSection icon="sparkles" title="Recommended for you" subtitle="Hand-picked matches for your level" recipes={homeFeeds.recommended} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={openAuthor} />
      <RecipeSection icon="bolt" iconColor={colors.gold} iconBackground="#F8EED6" title="Easy wins" subtitle="Under 20 minutes, no fuss" recipes={homeFeeds.easyWins} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={openAuthor} />
      <RecipeSection icon="trophy" iconColor={colors.terracotta} iconBackground={colors.terraBg} title="Challenge yourself" subtitle="Push your skills further" recipes={homeFeeds.challenge} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={openAuthor} />
      <RecipeSection icon="social" iconColor="#4A7A99" iconBackground="#E3EEF4" title="From your friends" subtitle="What the community cooked this week" recipes={homeFeeds.friends} loading={feedsLoading} onOpen={handleOpenRecipe} onAuthorPress={openAuthor} />
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
      onAuthorPress={openRecipeAuthorId ? () => router.push(`/profile/${openRecipeAuthorId}`) : undefined}
    />
    </>
  );
}

export default function HomeScreenRoute() {
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  profileAction: { position: "relative", width: 54, height: 54, alignItems: "center", justifyContent: "center" },
  avatar: { width: 48, height: 48, borderRadius: 16, overflow: "hidden", backgroundColor: colors.sageLight, borderWidth: 2, borderColor: colors.card },
  avatarInitial: { color: colors.sage, fontSize: 20, fontWeight: "800" },
  avatarBadge: { position: "absolute", right: -2, bottom: -2, maxWidth: 88, backgroundColor: colors.sageLight, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.card },
  avatarBadgeText: { color: colors.sage, fontSize: 8, fontWeight: "800", textAlign: "center" },

  // Streak
  streakCard: { marginHorizontal: layout.gutter, marginBottom: layout.sectionGap, backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18 },
  streakContent: { alignItems: "stretch", gap: 16 },
  streakHeader: { flexDirection: "row", alignItems: "center", gap: 13 },
  streakCopy: { flex: 1 },
  streakTitle: { fontFamily: fonts.heading, fontSize: 28, color: colors.ink, lineHeight: 32 },
  streakDays: { fontFamily: fonts.heading, fontSize: 17, color: colors.muted },
  streakSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "600", color: colors.muted },
  streakDaysRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 4, paddingTop: 2 },
  dayColumn: { flex: 1, maxWidth: 42, alignItems: "center", gap: 7 },
  dayDot: { width: 34, height: 34, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: "#F1EDE7", borderWidth: 1, borderColor: "#E9E2DA" },
  dayDotActive: { backgroundColor: colors.sage, borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  dayLabel: { fontSize: 10, fontWeight: "700", color: colors.faint },
  dayLabelActive: { color: colors.sage },
  dayDotToday: { borderWidth: 2, borderColor: colors.sageMid, backgroundColor: colors.sageLight },
  dayDotFuture: { opacity: 0.55 },
  dayLabelToday: { color: colors.sage, fontWeight: "800", fontSize: 9 },
});
