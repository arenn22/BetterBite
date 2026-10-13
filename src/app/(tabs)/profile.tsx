import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { BotanicalBanner } from "@/components/profile/botanical-banner";
import { ScreenHeader } from "@/components/screen-header";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EXPERIENCE_LEVEL_NAMES, getExperienceLevelName } from "@/constants/experience-levels";
import { useAuthContext } from "@/lib/auth/auth-context";
import { getActiveStreak } from "@/lib/streak";
import { toRecipeCardData, updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { getCookedPostsByUser } from "@/services/api/cooked-posts";
import { fetchPosts, getLikedPostsByUser, incrementPostViews, likePost, unlikePost } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE, fetchUserProfile, getXpPercentageLeftToNextLevel } from "@/services/api/profiles";
import { fetchFriends } from "@/services/api/social";
import type { Profile } from "@/types/auth";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Image, Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fonts, layout, radii, shadowMd, shadowSm } from "./theme";

type ProfileFriend = { id: string; name: string; initials: string; color: string; streak: number; img?: string };

const FRIEND_COLORS = ["#D9A28B", colors.sage, "#9B6B2A", "#8A9E7A", "#B5603A", colors.muted];

function normalizeFriend(value: Record<string, unknown>, index: number): ProfileFriend {
  const name = String(value.username ?? value.friend_username ?? value.display_name ?? value.name ?? "Friend");
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return {
    id: String(value.id ?? value.profile_id ?? value.friend_id ?? index),
    name,
    initials,
    color: FRIEND_COLORS[index % FRIEND_COLORS.length],
    streak: getActiveStreak(value.streakCount ?? value.streakcount ?? value.streak_count ?? value.streak, (value.last_streak_post ?? value.last_post_at) as string | null | undefined),
    img: typeof value.pfp_url === "string" ? value.pfp_url : typeof value.friend_pfp_url === "string" ? value.friend_pfp_url : undefined,
  };
}

function uniqueRecipeCards(recipes: RecipeCardData[]): RecipeCardData[] {
  return [...new Map(recipes.map((recipe) => [recipe.id, recipe])).values()];
}

type TabId = "created" | "cooked" | "liked";
const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "created", label: "Created", icon: "edit" },
  { id: "cooked", label: "Cooked", icon: "pan" },
  { id: "liked", label: "Liked", icon: "heartFill" },
];

const EMPTY_TAB_COPY: Record<TabId, { icon: IconName; heading: string; sub: string }> = {
  liked: { icon: "heart", heading: "No liked recipes yet", sub: "Tap the heart on any recipe to save it here." },
  cooked: { icon: "pan", heading: "Nothing logged yet", sub: "Cook something and log it — it'll appear here." },
  created: { icon: "edit", heading: "No recipes created yet", sub: "When you write your first recipe, it'll live here." },
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ProfileScreenContent({ onOpenRecipe, userId }: { onOpenRecipe?: (id: string) => void; userId?: string }) {
  const { width } = useWindowDimensions();
  const { currentUser } = useAuthContext();
  const isOwner = userId === undefined;
  const profileId = userId ?? currentUser?.id;
  const openUserProfile = (userId: string) => router.push(`/profile/${userId}` as Href);
  const [activeTab, setActiveTab] = useState<TabId>("created");
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCardData | null>(null);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [createdRecipes, setCreatedRecipes] = useState<RecipeCardData[]>([]);
  const [cookedRecipes, setCookedRecipes] = useState<RecipeCardData[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<RecipeCardData[]>([]);
  const [friends, setFriends] = useState<ProfileFriend[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [xpPercentageLeft, setXpPercentageLeft] = useState<number | null>(null);
  const [xpProgressLoading, setXpProgressLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfileData() {
      setLoading(true);
      setLoadError(null);
      if (!profileId) {
        setLoading(false);
        return;
      }
      try {
        const [profile, created, cooked, liked, friendRows] = await Promise.all([
          isOwner ? Promise.resolve(currentUser) : fetchUserProfile(profileId),
          fetchPosts({ authorId: profileId }),
          getCookedPostsByUser(profileId),
          getLikedPostsByUser(),
          isOwner ? fetchFriends() : Promise.resolve([]),
        ]);
        if (!active) return;
        if (!profile) {
          setViewedProfile(null);
          setCreatedRecipes([]);
          setCookedRecipes([]);
          setLikedRecipes([]);
          setFriends([]);
          setLoadError("This profile could not be found.");
          return;
        }
        setViewedProfile(profile);
        setCreatedRecipes(uniqueRecipeCards(created.map((post) => toRecipeCardData(post))));
        setCookedRecipes(uniqueRecipeCards(cooked.map((post) => toRecipeCardData(post))));
        setLikedRecipes(isOwner ? uniqueRecipeCards(liked.map((post) => toRecipeCardData(post))) : []);
        setLikedPostIds(new Set(liked.map((post) => post.id)));
        setFriends((Array.isArray(friendRows) ? friendRows : []).map((friend, index) => normalizeFriend(friend as Record<string, unknown>, index)));
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load this profile.");
      } finally {
        if (active) {
          setLoading(false);
          setHasLoadedProfile(true);
          setRefreshing(false);
        }
      }
    }

    void loadProfileData();
    return () => { active = false; };
  }, [currentUser, isOwner, profileId, refreshKey]);

  useEffect(() => {
    let active = true;
    if (!isOwner || !currentUser) {
      setXpPercentageLeft(null);
      setXpProgressLoading(false);
      return () => { active = false; };
    }

    setXpProgressLoading(true);
    void getXpPercentageLeftToNextLevel()
      .then((percentage) => {
        if (active) setXpPercentageLeft(percentage);
      })
      .catch((error) => {
        console.error("Unable to load XP progress:", error);
        if (active) setXpPercentageLeft(null);
      })
      .finally(() => {
        if (active) setXpProgressLoading(false);
      });

    return () => { active = false; };
  }, [currentUser, isOwner, refreshKey]);

  const layoutWidth = Platform.OS === "web" ? width : width;
  const cardWidth = Platform.OS === "web"
    ? Math.min(280, (layoutWidth - 32 - 12) / 2)
    : (layoutWidth - 32 - 12) / 2;

  const tabRecipes: Record<TabId, RecipeCardData[]> = {
    created: createdRecipes,
    cooked: cookedRecipes,
    liked: likedRecipes,
  };
  const recipes = tabRecipes[activeTab];

  const handleOpenRecipe = (recipe: RecipeCardData) => {
    if (onOpenRecipe) {
      onOpenRecipe(String(recipe.id));
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const handleLikeRecipe = async (currentlyLiked: boolean) => {
    if (!selectedRecipe || likedPostIds.has(selectedRecipe.id) !== currentlyLiked) return;
    setLikeLoading(true);
    try {
      if (currentlyLiked) await unlikePost(selectedRecipe.id);
      else await likePost(selectedRecipe.id);

      const likesChange = currentlyLiked ? -1 : 1;
      setLikedPostIds((current) => {
        const next = new Set(current);
        if (currentlyLiked) next.delete(selectedRecipe.id);
        else next.add(selectedRecipe.id);
        return next;
      });
      setSelectedRecipe((current) => current
        ? updateRecipeCardData(current, { likes: Math.max(0, current.likes + likesChange) })
        : current);
      setCreatedRecipes((current) => current.map((recipe) => recipe.id === selectedRecipe.id
        ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) })
        : recipe));
      setCookedRecipes((current) => current.map((recipe) => recipe.id === selectedRecipe.id
        ? updateRecipeCardData(recipe, { likes: Math.max(0, recipe.likes + likesChange) })
        : recipe));
      setLikedRecipes((current) => currentlyLiked
        ? current.filter((recipe) => recipe.id !== selectedRecipe.id)
        : current.some((recipe) => recipe.id === selectedRecipe.id)
          ? current
          : [...current, updateRecipeCardData(selectedRecipe, { likes: selectedRecipe.likes + 1 })]);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleOpenAndTrackRecipe = (recipe: RecipeCardData) => {
    handleOpenRecipe(recipe);
    void incrementPostViews(recipe.id).then(() => {
      setSelectedRecipe((current) => current?.id === recipe.id ? updateRecipeCardData(current, { views: current.views + 1 }) : current);
    }).catch((error) => console.error("Unable to increment views for post:", error));
  };

  const profile = isOwner ? currentUser : viewedProfile;
  const experienceLevel = Number(profile?.experience_level ?? profile?.experienceLevel) || 1;
  const tier = getExperienceLevelName(experienceLevel) ?? "Home Cook";
  const nextTier = EXPERIENCE_LEVEL_NAMES[experienceLevel] ?? "Max level";
  const progressToNextLevel = xpPercentageLeft === null ? null : 100 - xpPercentageLeft;
  const tierProgress = (progressToNextLevel ?? 0) / 100;
  const stats: { label: string; value: string; icon: IconName; color: string }[] = [
    { label: "Recipes", value: String(createdRecipes.length), icon: "book", color: colors.sage },
    { label: "Friends", value: isOwner ? String(friends.length) : "--", icon: "social", color: "#4A7A99" },
    { label: "Streak", value: String(getActiveStreak(profile?.streakCount ?? profile?.streakcount, profile?.last_streak_post ?? profile?.last_post_at)), icon: "flame", color: colors.flame },
  ];
  const selectedAuthorId = selectedRecipe?.post?.profile_id;
  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);

  if (loading && !hasLoadedProfile) return <ActivityIndicator color={colors.sage} style={{ flex: 1, paddingTop: 80 }} />;
  if (!profile) {
    return (
      <EmptyState
        tone="error"
        icon="profile"
        title="Profile not found"
        message={loadError ?? "This profile could not be found."}
        action={!isOwner ? <Button title="Go back" icon="back" variant="outline" size="sm" onPress={() => router.back()} /> : undefined}
      />
    );
  }

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 90 }}
      refreshControl={Platform.OS === "web" ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setRefreshKey((key) => key + 1);
          }}
          tintColor={colors.sage}
          colors={[colors.sage]}
        />
      )}
    >
      <ScreenHeader
        title="Profile"
        action={isOwner ? (
          <PressableScale
            onPress={() => router.push("/settings" as Href)}
            pressScale={0.9}
            style={[styles.headerButton, shadowSm]}
            hoverStyle={styles.headerButtonHover}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <AppIcon name="settings" size={18} color={colors.muted} />
          </PressableScale>
        ) : (
          <Button title="Back" icon="back" variant="outline" size="sm" onPress={() => router.back()} accessibilityLabel="Go back" />
        )}
      />

      {/* PROFILE CARD */}
      <FadeIn delay={60} style={[styles.profileCard, shadowSm]}>
        {/* Banner */}
        <View style={{ height: 112, overflow: "hidden" }}>
          <BotanicalBanner />
        </View>

        {/* Avatar overlaps banner */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginTop: -36 }}>
          <View style={{ marginBottom: 12 }}>
            {/* ring with gap, replaces CSS outline + outline-offset */}
            <View style={[styles.avatarRing, shadowMd]}>
              <View style={styles.avatarInner}>
                <Image source={{ uri: profile.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.fill} resizeMode="cover" />
              </View>
            </View>
          </View>

          {/* Name & handle */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.name}>{profile.username || "BetterBite member"}</Text>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.faint }}>@{profile.username || "member"}</Text>
          </View>

          {/* Tier badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <View style={styles.tierBadge}>
              <AppIcon name="medal" size={13} color={colors.sage} weight="semibold" />
              <Text style={styles.tierText}>{tier}</Text>
            </View>
            <AppIcon name="forward" size={11} color={colors.faint} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.faint }}>{nextTier}</Text>
          </View>

          {/* Progress */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={styles.progressLabel}>
                Progress to {nextTier}
              </Text>
              <Text style={styles.progressValue}>
                {xpProgressLoading ? "…" : progressToNextLevel === null ? "--" : `${progressToNextLevel.toFixed(2)}%`}
              </Text>
            </View>
            <ProgressBar progress={tierProgress} height={7} />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <View key={stat.label} style={[styles.statCell, i > 0 && styles.statDivider]}>
                <View style={styles.statValueRow}>
                  <AppIcon name={stat.icon} size={15} color={stat.color} weight="semibold" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      {/* YOUR FRIENDS */}
      {isOwner && friends.length > 0 ? <FadeIn delay={120} style={{ paddingHorizontal: layout.gutter, marginBottom: layout.sectionGap }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel icon="social">Your friends</SectionLabel>
          <PressableScale onPress={() => router.push("/social" as Href)} style={styles.seeAll} hoverStyle={styles.seeAllHover} accessibilityRole="button">
            <Text style={styles.seeAllText}>See all</Text>
            <AppIcon name="chevronRight" size={11} color={colors.sage} weight="bold" />
          </PressableScale>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingTop: 4, paddingBottom: 4 }}>
          {friends.map((f) => (
            <PressableScale key={f.id} onPress={() => openUserProfile(f.id)} pressScale={0.92} hoverLift={2} style={{ alignItems: "center", gap: 6 }} accessibilityRole="button" accessibilityLabel={`Open ${f.name}'s profile`}>
              <View>
                <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
                  {f.img ? (
                    <Image source={{ uri: f.img }} style={styles.fill} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{f.initials}</Text>
                  )}
                </View>
                {f.streak > 0 && (
                  <View style={styles.flameBadge}>
                    <AppIcon name="flame" size={11} color={colors.flame} />
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "600", color: colors.muted, maxWidth: 52, textAlign: "center" }}>
                {f.name}
              </Text>
            </PressableScale>
          ))}
          {loadError ? <Text style={{ fontSize: 11, color: colors.terracotta }}>{loadError}</Text> : null}
        </ScrollView>
      </FadeIn> : null}

      {/* RECIPE LIBRARY */}
      <View style={{ paddingHorizontal: layout.gutter }}>
        <SectionLabel icon="book">{isOwner ? "Your recipe library" : "Recipe library"}</SectionLabel>

        {/* Tabs */}
        <View style={styles.tabRow} onLayout={(event) => setTabRowWidth(event.nativeEvent.layout.width)}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = tabRecipes[tab.id].length;
            return (
              <PressableScale
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                pressScale={0.95}
                style={styles.tabBtn}
                hoverStyle={styles.tabBtnHover}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <AppIcon name={tab.icon} size={14} color={active ? colors.sage : colors.faint} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: active ? colors.ink : colors.faint }}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={{ backgroundColor: active ? colors.sageLight : colors.divider, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radii.pill }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: active ? colors.sage : colors.faint }}>{count}</Text>
                    </View>
                  )}
                </View>
              </PressableScale>
            );
          })}
          {tabRowWidth > 0 ? <TabUnderline index={activeTabIndex} tabWidth={tabRowWidth / TABS.length} /> : null}
        </View>

        {/* Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {loading ? (
            <ActivityIndicator color={colors.sage} style={{ width: "100%", height: 150 }} />
          ) : recipes.length === 0 ? (
            <EmptyState icon={EMPTY_TAB_COPY[activeTab].icon} title={EMPTY_TAB_COPY[activeTab].heading} message={EMPTY_TAB_COPY[activeTab].sub} />
          ) : (
            recipes.map((r, index) => {
              const authorId = r.post?.profile_id;
              return (
                <FadeIn key={`${activeTab}-${r.id}`} delay={Math.min(index, 8) * 50}>
                  <RecipeCard
                    recipe={r}
                    width={cardWidth}
                    compact
                    onPress={() => handleOpenAndTrackRecipe(r)}
                    onAuthorPress={authorId ? () => openUserProfile(authorId) : undefined}
                  />
                </FadeIn>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
    <RecipeDetailsModal
      post={selectedRecipe?.post ?? null}
      visible={selectedRecipe !== null}
      difficulty={selectedRecipe?.difficulty ?? ""}
      cookingTime={selectedRecipe?.time}
      likes={selectedRecipe?.likes ?? 0}
      views={selectedRecipe?.views ?? 0}
      liked={selectedRecipe ? likedPostIds.has(selectedRecipe.id) : false}
      likeLoading={likeLoading}
      onClose={() => setSelectedRecipe(null)}
      onLike={handleLikeRecipe}
      onAuthorPress={selectedAuthorId ? () => openUserProfile(selectedAuthorId) : undefined}
    />
    </>
  );
}

/** Sage underline that slides between the library tabs. */
function TabUnderline({ index, tabWidth }: { index: number; tabWidth: number }) {
  const offset = useSharedValue(index * tabWidth);

  useEffect(() => {
    offset.value = withSpring(index * tabWidth, { damping: 20, stiffness: 240 });
  }, [index, offset, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.tabUnderlineTrack, { width: tabWidth }, animatedStyle]}>
      <View style={styles.tabUnderline} />
    </Animated.View>
  );
}

export default function ProfileScreenRoute() {
  return <ProfileScreenContent />;
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  headerButton: { width: 40, height: 40, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  headerButtonHover: { backgroundColor: colors.bg, borderColor: colors.sageMid },

  profileCard: { marginHorizontal: layout.gutter, marginBottom: layout.sectionGap, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },

  avatarRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: colors.clay, backgroundColor: colors.card, padding: 2 },
  avatarInner: { flex: 1, borderRadius: radii.pill, overflow: "hidden" },
  name: { fontFamily: fonts.heading, fontSize: 22, color: colors.ink, lineHeight: 26 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.sageLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  tierText: { fontSize: 12, fontWeight: "800", color: colors.sage },
  progressLabel: { fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  progressValue: { fontSize: 10, fontWeight: "800", color: colors.sage },

  statsRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 14, flexDirection: "row" },
  statCell: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.divider },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },

  seeAll: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  seeAllHover: { backgroundColor: colors.sageLight },
  seeAllText: { fontSize: 11, fontWeight: "700", color: colors.sage },

  friendAvatar: { width: 52, height: 52, borderRadius: 26, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
  flameBadge: { position: "absolute", bottom: -3, right: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider, alignItems: "center", justifyContent: "center" },

  tabRow: { flexDirection: "row", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn: { flex: 1, alignItems: "center", paddingBottom: 10, paddingTop: 6, borderTopLeftRadius: radii.sm, borderTopRightRadius: radii.sm },
  tabBtnHover: { backgroundColor: colors.sageLight },
  tabUnderlineTrack: { position: "absolute", left: 0, bottom: -1, height: 2, alignItems: "center" },
  tabUnderline: { width: "60%", height: 2, backgroundColor: colors.sage, borderRadius: radii.pill },
});
