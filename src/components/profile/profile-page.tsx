import { RecipeCard } from "@/components/recipes/recipe-card";
import { BotanicalBanner } from "@/components/profile/botanical-banner";
import { ScreenHeader } from "@/components/screen-header";
import { EXPERIENCE_LEVEL_NAMES, getExperienceLevelName } from "@/constants/experience-levels";
import { BotanicalBanner } from "@/app/(tabs)/profile";
import { toRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { getCookedPostsByUser } from "@/services/api/cooked-posts";
import { fetchPosts } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE, fetchUserProfile } from "@/services/api/profiles";
import type { Profile } from "@/types/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";

export function ProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [created, setCreated] = useState<RecipeCardData[]>([]);
  const [cooked, setCooked] = useState<RecipeCardData[]>([]);
  const [activeTab, setActiveTab] = useState<"created" | "cooked">("created");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([fetchUserProfile(userId), fetchPosts({ authorId: userId }), getCookedPostsByUser(userId)])
      .then(([user, posts, cookedPosts]) => {
        if (!active) return;
        if (!user) {
          setError("This profile could not be found.");
          return;
        }
        setProfile(user);
        setCreated(posts.map((post) => toRecipeCardData(post)));
        setCooked(cookedPosts.map((post) => toRecipeCardData(post)));
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load this profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  if (loading) return <ActivityIndicator color={colors.sage} style={styles.loading} />;
  if (!profile) return <Text style={styles.error}>{error ?? "This profile could not be found."}</Text>;

  const level = Number(profile.experience_level ?? profile.experienceLevel) || 1;
  const tier = getExperienceLevelName(level) ?? "Home Cook";
  const nextTier = EXPERIENCE_LEVEL_NAMES[level] ?? "Max level";
  const recipes = activeTab === "created" ? created : cooked;
  const streak = Number(profile.streakCount ?? profile.streakcount ?? 0);
  const layoutWidth = Platform.OS === "web" ? Math.min(width, 430) : width;
  const cardWidth = (layoutWidth - 32 - 12) / 2;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScreenHeader
        eyebrow="Community profile"
        title="Profile"
        subtitle="Food, friends, and progress."
        action={<Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Text style={styles.back}>Back</Text></Pressable>}
      />
      <View style={[styles.profileCard, shadowSm]}>
        <View style={styles.banner}>
          <BotanicalBanner />
        </View>
        <View style={styles.profileBody}>
          <View style={[styles.avatarRing, shadowSm]}>
            <Image source={{ uri: profile.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.avatar} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{profile.username || "BetterBite member"}</Text>
            <Text style={styles.handle}>@{profile.username || "member"}</Text>
          </View>
          <View style={styles.tierRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{tier}</Text></View>
            <Text style={styles.nextTier}>→ {nextTier}</Text>
          </View>
          <View style={styles.progress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress to {nextTier}</Text>
              <Text style={styles.progressValue}>--</Text>
            </View>
            <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          </View>
          <View style={styles.stats}>
            <Stat label="Recipes" value={created.length} />
            <Stat label="Level" value={level} />
            <Stat label="Streak" value={`${streak}🔥`} />
          </View>
        </View>
      </View>
      <View style={styles.library}>
        <Text style={styles.sectionLabel}>Recipe library</Text>
        <View style={styles.tabs}>
          {(["created", "cooked"] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <View style={styles.tabLabel}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>{tab === "created" ? "Created" : "Cooked"}</Text>
                <View style={[styles.count, activeTab === tab && styles.activeCount]}><Text style={[styles.countText, activeTab === tab && styles.activeCountText]}>{tab === "created" ? created.length : cooked.length}</Text></View>
              </View>
              {activeTab === tab ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          ))}
        </View>
        {recipes.length ? (
          <View style={styles.grid}>
            {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact width={cardWidth} onPress={() => {}} />)}
          </View>
        ) : <Text style={styles.empty}>Nothing here yet.</Text>}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  loading: { flex: 1, paddingTop: 80 },
  error: { padding: 24, color: colors.terracotta, textAlign: "center" },
  profileCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  banner: { height: 112, overflow: "hidden" },
  profileBody: { paddingHorizontal: 16, paddingBottom: 16, marginTop: -36 },
  avatarRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.clay, backgroundColor: "#fff", padding: 2 },
  avatar: { width: "100%", height: "100%", borderRadius: 999, backgroundColor: colors.sageLight },
  nameBlock: { marginTop: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: colors.ink },
  handle: { marginTop: 2, fontSize: 12, fontWeight: "500", color: colors.faint },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.sageLight },
  badgeText: { fontSize: 12, fontWeight: "800", color: colors.sage },
  nextTier: { fontSize: 10, fontWeight: "500", color: colors.faint },
  progress: { marginBottom: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  progressValue: { fontSize: 9, fontWeight: "700", color: colors.sage },
  progressTrack: { height: 6, backgroundColor: colors.divider, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", width: "0%", backgroundColor: colors.sage, borderRadius: 999 },
  stats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.sage },
  statLabel: { marginTop: 2, fontSize: 10, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  library: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: { marginBottom: 10, fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  tab: { paddingHorizontal: 2, paddingBottom: 8, marginRight: 20 },
  tabLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabText: { fontSize: 12, fontWeight: "700", color: colors.faint },
  activeTab: { color: colors.ink },
  count: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.divider },
  activeCount: { backgroundColor: colors.sageLight },
  countText: { fontSize: 9, fontWeight: "800", color: colors.faint },
  activeCountText: { color: colors.sage },
  tabUnderline: { height: 2, marginTop: 7, backgroundColor: colors.sage },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  empty: { paddingVertical: 32, textAlign: "center", color: colors.muted },
  back: { marginTop: 8, color: colors.sage, fontSize: 12, fontWeight: "800" },
});
