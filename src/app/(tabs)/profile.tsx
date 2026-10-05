import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { ScreenHeader } from "@/components/screen-header";
import { EXPERIENCE_LEVEL_NAMES, getExperienceLevelName } from "@/constants/experience-levels";
import { useAuthContext } from "@/lib/auth/auth-context";
import { toRecipeCardData, updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { getCookedPostsByUser } from "@/services/api/cooked-posts";
import { fetchPosts, getLikedPostsByUser, incrementPostViews, likePost } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE } from "@/services/api/profiles";
import { fetchFriends } from "@/services/api/social";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Image, Platform, Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import Svg, {
  Circle, Defs,
  Ellipse, G, Line,
  Path,
  Rect,
  Stop, LinearGradient as SvgLinearGradient,
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

// ─── Botanical SVG banner illustration ───────────────────────────────────────

function BotanicalBanner() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 120" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgLinearGradient id="bannerFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7F7F4" stopOpacity={0} />
          <Stop offset="1" stopColor="#F7F7F4" stopOpacity={1} />
        </SvgLinearGradient>
      </Defs>

      <Rect width={390} height={120} fill="#F0E8DF" />

      <Ellipse cx={60} cy={30} rx={70} ry={45} fill="#D9A28B" opacity={0.25} />
      <Ellipse cx={330} cy={90} rx={80} ry={50} fill="#C4855F" opacity={0.18} />
      <Ellipse cx={200} cy={60} rx={120} ry={60} fill="#E8C4AE" opacity={0.2} />

      <G transform="translate(18,14) rotate(-20)">
        <Ellipse cx={0} cy={0} rx={12} ry={5} fill="#687B5D" opacity={0.55} />
        <Ellipse cx={18} cy={-4} rx={10} ry={4} fill="#8A9E7A" opacity={0.45} />
        <Ellipse cx={10} cy={9} rx={9} ry={3.5} fill="#687B5D" opacity={0.4} />
        <Line x1={0} y1={0} x2={12} y2={0} stroke="#4A5E3D" strokeWidth={0.7} opacity={0.5} />
      </G>

      <G transform="translate(350,16) rotate(15)">
        <Ellipse cx={0} cy={0} rx={14} ry={5.5} fill="#8A9E7A" opacity={0.5} />
        <Ellipse cx={-16} cy={6} rx={10} ry={4} fill="#687B5D" opacity={0.45} />
        <Ellipse cx={12} cy={8} rx={8} ry={3} fill="#8A9E7A" opacity={0.4} />
        <Line x1={-14} y1={0} x2={14} y2={0} stroke="#4A5E3D" strokeWidth={0.7} opacity={0.5} />
      </G>

      <G transform="translate(195,8)">
        <Line x1={0} y1={0} x2={0} y2={28} stroke="#687B5D" strokeWidth={1.2} opacity={0.6} />
        <Ellipse cx={-7} cy={8} rx={6} ry={2.5} fill="#8A9E7A" opacity={0.55} transform="rotate(-30 -7 8)" />
        <Ellipse cx={7} cy={14} rx={6} ry={2.5} fill="#687B5D" opacity={0.5} transform="rotate(30 7 14)" />
        <Ellipse cx={-6} cy={20} rx={5} ry={2} fill="#8A9E7A" opacity={0.45} transform="rotate(-25 -6 20)" />
        <Ellipse cx={5} cy={25} rx={5} ry={2} fill="#687B5D" opacity={0.4} transform="rotate(25 5 25)" />
      </G>

      <G transform="translate(80,65)" opacity={0.55}>
        <Circle cx={0} cy={0} r={4} fill="#D9A28B" />
        <Circle cx={9} cy={-3} r={3} fill="#C4855F" />
        <Circle cx={5} cy={7} r={3.5} fill="#D9A28B" />
        <Line x1={0} y1={0} x2={-8} y2={-10} stroke="#687B5D" strokeWidth={0.8} />
        <Line x1={9} y1={-3} x2={4} y2={-12} stroke="#687B5D" strokeWidth={0.8} />
      </G>

      <G transform="translate(310,78) rotate(10)">
        <Line x1={0} y1={0} x2={0} y2={-26} stroke="#8A9E7A" strokeWidth={1} opacity={0.55} />
        <Ellipse cx={-6} cy={-8} rx={5.5} ry={2.2} fill="#687B5D" opacity={0.5} transform="rotate(-35 -6 -8)" />
        <Ellipse cx={6} cy={-15} rx={5} ry={2} fill="#8A9E7A" opacity={0.45} transform="rotate(35 6 -15)" />
        <Ellipse cx={-5} cy={-21} rx={4.5} ry={2} fill="#687B5D" opacity={0.4} transform="rotate(-30 -5 -21)" />
      </G>

      {[[135, 22], [145, 35], [280, 30], [270, 18], [155, 70], [100, 45], [240, 80], [370, 50], [30, 85], [50, 60]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={1.8} fill="#C4855F" opacity={0.3} />
      ))}

      <Rect width={390} height={40} y={80} fill="url(#bannerFade)" />
    </Svg>
  );
}

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

export default function ProfileScreen({ onOpenRecipe }: { onOpenRecipe?: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const { currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabId>("created");
  const [editMode, setEditMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCardData | null>(null);
  const [createdRecipes, setCreatedRecipes] = useState<RecipeCardData[]>([]);
  const [cookedRecipes, setCookedRecipes] = useState<RecipeCardData[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<RecipeCardData[]>([]);
  const [friends, setFriends] = useState<ProfileFriend[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    let active = true;

    async function loadProfileData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [created, cooked, liked, friendRows] = await Promise.all([
          fetchPosts({ authorId: userId }),
          getCookedPostsByUser(userId),
          getLikedPostsByUser(),
          fetchFriends(),
        ]);
        if (!active) return;
        setCreatedRecipes(uniqueRecipeCards(created.map((post) => toRecipeCardData(post))));
        setCookedRecipes(uniqueRecipeCards(cooked.map((post) => toRecipeCardData(post))));
        setLikedRecipes(uniqueRecipeCards(liked.map((post) => toRecipeCardData(post))));
        setLikedPostIds(new Set(liked.map((post) => post.id)));
        setFriends((Array.isArray(friendRows) ? friendRows : []).map((friend, index) => normalizeFriend(friend as Record<string, unknown>, index)));
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfileData();
    return () => { active = false; };
  }, [currentUser]);

  const layoutWidth = Platform.OS === "web" ? Math.min(width, 430) : width;
  const cardWidth = (layoutWidth - 32 - 12) / 2;

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

  const handleLikeRecipe = async () => {
    if (!selectedRecipe || likedPostIds.has(selectedRecipe.id)) return;
    setLikeLoading(true);
    try {
      await likePost(selectedRecipe.id);
      setLikedPostIds((current) => new Set(current).add(selectedRecipe.id));
      setSelectedRecipe((current) => current ? updateRecipeCardData(current, { likes: current.likes + 1 }) : current);
      setCreatedRecipes((current) => current.map((recipe) => recipe.id === selectedRecipe.id ? updateRecipeCardData(recipe, { likes: recipe.likes + 1 }) : recipe));
      setCookedRecipes((current) => current.map((recipe) => recipe.id === selectedRecipe.id ? updateRecipeCardData(recipe, { likes: recipe.likes + 1 }) : recipe));
      setLikedRecipes((current) => current.some((recipe) => recipe.id === selectedRecipe.id) ? current : [...current, updateRecipeCardData(selectedRecipe, { likes: selectedRecipe.likes + 1 })]);
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

  const experienceLevel = Number(currentUser?.experience_level ?? currentUser?.experienceLevel) || 1;
  const tier = getExperienceLevelName(experienceLevel) ?? "Home Cook";
  const nextTier = EXPERIENCE_LEVEL_NAMES[experienceLevel] ?? "Max level";
  const tierProgress = Math.min(1, experienceLevel / EXPERIENCE_LEVEL_NAMES.length);
  const stats = [
    { label: "Recipes", value: String(createdRecipes.length) },
    { label: "Friends", value: String(friends.length) },
    { label: "Streak", value: `${Number(currentUser?.streakCount ?? currentUser?.streakcount ?? 0)}🔥` },
  ];

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <ScreenHeader
        eyebrow="Your account"
        title="Profile"
        subtitle="Your food, friends, and progress."
        action={(
          <Pressable
            onPress={() => setEditMode(!editMode)}
            style={({ pressed }) => [
              styles.settingsBtn,
              editMode && { backgroundColor: colors.sage, borderColor: colors.sage },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={editMode ? "Close profile editing" : "Settings"}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={editMode ? "#fff" : colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={3} />
              <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2m0 18v-2M2 12h2m18 0h-2" />
            </Svg>
          </Pressable>
        )}
      />

      {/* PROFILE CARD */}
      <View style={[styles.profileCard, shadowSm]}>
        {/* Banner */}
        <View style={{ height: 112, overflow: "hidden" }}>
          <BotanicalBanner />
          {editMode && (
            <Pressable style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" }]}>
              <View style={{ backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Change banner</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Avatar overlaps banner */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginTop: -36 }}>
          <View style={{ marginBottom: 12 }}>
            <View>
              {/* ring with gap, replaces CSS outline + outline-offset */}
              <View style={[styles.avatarRing, shadowMd]}>
                <View style={styles.avatarInner}>
                  <Image source={{ uri: currentUser?.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.fill} resizeMode="cover" />
                </View>
              </View>
              {editMode && (
                <View style={[styles.avatarRing, { position: "absolute", borderColor: "transparent", backgroundColor: "transparent" }]}>
                  <View style={[styles.avatarInner, { backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontSize: 12 }}>📷</Text>
                  </View>
                </View>
              )}
            </View>

          </View>

          {/* Name & handle */}
          <View style={{ marginBottom: 12 }}>
            {editMode ? (
              <TextInput defaultValue={currentUser?.username ?? ""} style={styles.nameInput} />
            ) : (
              <Text style={styles.name}>{currentUser?.username || "BetterBite member"}</Text>
            )}
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.faint }}>@{currentUser?.username || "member"}</Text>
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
                {Math.round(tierProgress * 100)}%
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
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
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
      </View>

      {/* RECIPE LIBRARY */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Your recipe library</Text>

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
              <RecipeCard
                key={r.id}
                recipe={r}
                width={cardWidth}
                compact
                onPress={() => handleOpenAndTrackRecipe(r)}
              />
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
    />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  settingsBtn: { marginTop: 4, width: 32, height: 32, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  profileCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },

  avatarRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.clay, backgroundColor: "#fff", padding: 2 },
  avatarInner: { flex: 1, borderRadius: 999, overflow: "hidden" },
  name: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, lineHeight: 24 },
  nameInput: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, backgroundColor: colors.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.clay, marginBottom: 2 },

  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },

  friendAvatar: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  flameBadge: { position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.divider, alignItems: "center", justifyContent: "center" },
  addFriend: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: "#D5D5CE", alignItems: "center", justifyContent: "center" },

  tabBtn: { flex: 1, alignItems: "center", paddingBottom: 10, paddingTop: 4 },
  tabUnderline: { position: "absolute", bottom: 0, left: 16, right: 16, height: 2, backgroundColor: colors.sage, borderRadius: 999 },

});