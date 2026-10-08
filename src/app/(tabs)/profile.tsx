import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { BotanicalBanner } from "@/components/profile/botanical-banner";
import { ScreenHeader } from "@/components/screen-header";
import { EXPERIENCE_LEVEL_NAMES, getExperienceLevelName } from "@/constants/experience-levels";
import { useAuthContext } from "@/lib/auth/auth-context";
import { toRecipeCardData, updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { getCookedPostsByUser } from "@/services/api/cooked-posts";
import { fetchPosts, getLikedPostsByUser, incrementPostViews, likePost, unlikePost } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE, fetchUserProfile, getXpPercentageLeftToNextLevel } from "@/services/api/profiles";
import { fetchFriends } from "@/services/api/social";
import type { Profile } from "@/types/auth";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Image, Platform, Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import Svg, {
  Circle,
  Path,
} from "react-native-svg";
import { colors, fonts, shadowMd, shadowSm } from "./theme";

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
    streak: Number(value.streakCount ?? value.streakcount ?? value.streak ?? 0) || 0,
    img: typeof value.pfp_url === "string" ? value.pfp_url : typeof value.friend_pfp_url === "string" ? value.friend_pfp_url : undefined,
  };
}

function uniqueRecipeCards(recipes: RecipeCardData[]): RecipeCardData[] {
  return [...new Map(recipes.map((recipe) => [recipe.id, recipe])).values()];
}

type TabId = "created" | "cooked" | "liked";
const TABS: { id: TabId; label: string }[] = [
  { id: "created", label: "Created" },
  { id: "cooked", label: "Cooked" },
  { id: "liked", label: "Liked" },
];

// ─── Empty tab state ──────────────────────────────────────────────────────────

function EmptyTabState({ tab }: { tab: TabId }) {
  const copy: Record<TabId, { emoji: string; heading: string; sub: string }> = {
    liked: { emoji: "🤍", heading: "No liked recipes yet", sub: "Tap the heart on any recipe to save it here." },
    cooked: { emoji: "🍳", heading: "Nothing logged yet", sub: "Cook something and log it — it'll appear here." },
    created: { emoji: "✏️", heading: "No recipes created yet", sub: "When you write your first recipe, it'll live here." },
  };
  const { emoji, heading, sub } = copy[tab];
  return (
    <View style={{ width: "100%", alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 80, height: 80, marginBottom: 16, alignItems: "center", justifyContent: "center" }}>
        <Svg width={80} height={80} viewBox="0 0 80 80" style={StyleSheet.absoluteFill}>
          <Circle cx={40} cy={40} r={32} fill="#F0E8DF" />
          <Circle cx={40} cy={40} r={22} fill="none" stroke="#D9A28B" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
        </Svg>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <Text style={{ fontFamily: fonts.headingSemi, fontSize: 16, color: colors.ink, marginBottom: 4 }}>{heading}</Text>
      <Text style={{ fontSize: 12, fontWeight: "500", color: colors.muted, lineHeight: 19, textAlign: "center" }}>{sub}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ProfileScreenContent({ onOpenRecipe, userId }: { onOpenRecipe?: (id: string) => void; userId?: string }) {
  const { width } = useWindowDimensions();
  const { currentUser } = useAuthContext();
  const isOwner = userId === undefined;
  const profileId = userId ?? currentUser?.id;
  const openUserProfile = (userId: string) => router.push(`/profile/${userId}` as Href);
  const [activeTab, setActiveTab] = useState<TabId>("created");
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
  const stats = [
    { label: "Recipes", value: String(createdRecipes.length) },
    { label: "Friends", value: isOwner ? String(friends.length) : "--" },
    { label: "Streak", value: `${Number(profile?.streakCount ?? profile?.streakcount ?? 0)}🔥` },
  ];
  const selectedAuthorId = selectedRecipe?.post?.profile_id;

  if (loading && !hasLoadedProfile) return <ActivityIndicator color={colors.sage} style={{ flex: 1, paddingTop: 80 }} />;
  if (!profile) return <Text style={{ padding: 24, color: colors.terracotta, textAlign: "center" }}>{loadError ?? "This profile could not be found."}</Text>;

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
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
        eyebrow={isOwner ? "Your account" : "Community profile"}
        title="Profile"
        subtitle="Your food, friends, and progress."
        action={isOwner ? (
          <Pressable
            onPress={() => router.push("/settings" as Href)}
            style={({ pressed }) => [
              styles.settingsBtn,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={3} />
              <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2m0 18v-2M2 12h2m18 0h-2" />
            </Svg>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backBtnText}>‹ Back</Text>
          </Pressable>
        )}
      />

      {/* PROFILE CARD */}
      <View style={[styles.profileCard, shadowSm]}>
        {/* Banner */}
        <View style={{ height: 112, overflow: "hidden" }}>
          <BotanicalBanner />
        </View>

        {/* Avatar overlaps banner */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginTop: -36 }}>
          <View style={{ marginBottom: 12 }}>
            <View>
              {/* ring with gap, replaces CSS outline + outline-offset */}
              <View style={[styles.avatarRing, shadowMd]}>
                <View style={styles.avatarInner}>
                  <Image source={{ uri: profile.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.fill} resizeMode="cover" />
                </View>
              </View>
            </View>

          </View>

          {/* Name & handle */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.name}>{profile.username || "BetterBite member"}</Text>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.faint }}>@{profile.username || "member"}</Text>
          </View>

          {/* Tier badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: colors.sageLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.sage }}>{tier}</Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: colors.faint }}>→ {nextTier}</Text>
          </View>

          {/* Progress */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Progress to {nextTier}
              </Text>
              <Text style={{ fontSize: 9, fontWeight: "700", color: colors.sage }}>
                {xpProgressLoading ? "…" : progressToNextLevel === null ? "--" : `${progressToNextLevel.toFixed(2)}%`}
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.divider, borderRadius: 999, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${tierProgress * 100}%`, backgroundColor: colors.sage, borderRadius: 999 }} />
            </View>
          </View>

          {/* Stats */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12, flexDirection: "row" }}>
            {stats.map((stat, i) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: colors.divider,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.sage }}>{stat.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* YOUR FRIENDS */}
      {isOwner && friends.length > 0 ? <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={styles.sectionLabel}>Your friends</Text>
          <Pressable>
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted }}>See all →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4 }}>
          {friends.map((f) => (
            <View key={f.id} style={{ alignItems: "center", gap: 6 }}>
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
                    <Text style={{ fontSize: 9 }}>🔥</Text>
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: "600", color: colors.muted, maxWidth: 44, textAlign: "center" }}>
                {f.name}
              </Text>
            </View>
          ))}
          {loadError ? <Text style={{ fontSize: 11, color: colors.terracotta }}>{loadError}</Text> : null}
        </ScrollView>
      </View> : null}

      {/* RECIPE LIBRARY */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>{isOwner ? "Your recipe library" : "Recipe library"}</Text>

        {/* Tabs */}
        <View style={{ flexDirection: "row", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = tabRecipes[tab.id].length;
            return (
              <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.tabBtn}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: active ? colors.ink : colors.faint }}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={{ backgroundColor: active ? colors.sageLight : colors.divider, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: active ? colors.sage : colors.faint }}>{count}</Text>
                    </View>
                  )}
                </View>
                {active && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
        </View>

        {/* Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {loading ? (
            <ActivityIndicator color={colors.sage} style={{ width: "100%", height: 150 }} />
          ) : recipes.length === 0 ? (
            <EmptyTabState tab={activeTab} />
          ) : (
            recipes.map((r) => (
              (() => {
                const authorId = r.post?.profile_id;
                return <RecipeCard
                  key={r.id}
                  recipe={r}
                  width={cardWidth}
                  compact
                  onPress={() => handleOpenAndTrackRecipe(r)}
                  onAuthorPress={authorId ? () => openUserProfile(authorId) : undefined}
                />;
              })()
            ))
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

export default function ProfileScreenRoute() {
  return <ProfileScreenContent />;
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  settingsBtn: { marginTop: 4, width: 32, height: 32, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 4, minHeight: 32, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 12, fontWeight: "700", color: colors.muted },

  profileCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },

  avatarRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.clay, backgroundColor: "#fff", padding: 2 },
  avatarInner: { flex: 1, borderRadius: 999, overflow: "hidden" },
  name: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, lineHeight: 24 },

  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },

  friendAvatar: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  flameBadge: { position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.divider, alignItems: "center", justifyContent: "center" },
  addFriend: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: "#D5D5CE", alignItems: "center", justifyContent: "center" },

  tabBtn: { flex: 1, alignItems: "center", paddingBottom: 10, paddingTop: 4 },
  tabUnderline: { position: "absolute", bottom: 0, left: 16, right: 16, height: 2, backgroundColor: colors.sage, borderRadius: 999 },

});
