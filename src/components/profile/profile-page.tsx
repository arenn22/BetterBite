import { RecipeCard } from "@/components/recipes/recipe-card";
import { BotanicalBanner } from "@/components/profile/botanical-banner";
import { ScreenHeader } from "@/components/screen-header";
import { getExperienceLevelName } from "@/constants/experience-levels";
import { toRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { getCookedPostsByUser } from "@/services/api/cooked-posts";
import { fetchPosts } from "@/services/api/posts";
import { DEFAULT_PROFILE_IMAGE, fetchUserProfile } from "@/services/api/profiles";
import type { Profile } from "@/types/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";

export function ProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [created, setCreated] = useState<RecipeCardData[]>([]);
  const [cooked, setCooked] = useState<RecipeCardData[]>([]);
  const [activeTab, setActiveTab] = useState<"created" | "cooked">("created");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const recipes = activeTab === "created" ? created : cooked;
  const streak = Number(profile.streakCount ?? profile.streakcount ?? 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScreenHeader
        eyebrow="Community profile"
        title="Profile"
        subtitle="Food, friends, and progress."
        action={<Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Text style={styles.back}>Back</Text></Pressable>}
      />
      <View style={[styles.card, shadowSm]}>
        <View style={styles.banner}><BotanicalBanner /></View>
        <View style={styles.cardBody}>
          <Image source={{ uri: profile.pfp_url || DEFAULT_PROFILE_IMAGE }} style={styles.avatar} />
          <Text style={styles.name}>{profile.username || "BetterBite member"}</Text>
          <Text style={styles.handle}>@{profile.username || "member"}</Text>
          <View style={styles.badgeRow}><View style={styles.badge}><Text style={styles.badgeText}>{tier}</Text></View></View>
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
          {(["created", "cooked"] as const).map((tab) => {
            const active = activeTab === tab;
            const count = tab === "created" ? created.length : cooked.length;
            return <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.activeTab]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <Text style={[styles.tabText, active && styles.activeTabText]}>{tab === "created" ? "Created" : "Cooked"} ({count})</Text>
            </Pressable>;
          })}
        </View>
        {recipes.length ? (
          <View style={styles.grid}>
            {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact width={166} onPress={() => {}} />)}
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
  card: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  banner: { height: 112, overflow: "hidden", backgroundColor: "#F0E8DF" },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, marginTop: -36 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.clay, backgroundColor: colors.sageLight },
  name: { marginTop: 12, fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.ink },
  handle: { marginTop: 2, fontSize: 12, fontWeight: "500", color: colors.faint },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.sageLight },
  badgeText: { fontSize: 12, fontWeight: "800", color: colors.sage },
  stats: { flexDirection: "row", width: "100%", paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.sage },
  statLabel: { marginTop: 2, fontSize: 10, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
  library: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: { marginBottom: 10, fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
  tabs: { flexDirection: "row", gap: 20, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  tab: { paddingBottom: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.sage },
  tabText: { fontSize: 12, fontWeight: "700", color: colors.faint },
  activeTabText: { color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  empty: { paddingVertical: 32, textAlign: "center", color: colors.muted },
  back: { marginTop: 8, color: colors.sage, fontSize: 12, fontWeight: "800" },
});
