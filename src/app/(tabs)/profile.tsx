import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipePreviewModal } from "@/components/recipes/recipe-preview-modal";
import { ScreenHeader } from "@/components/screen-header";
import { useState } from "react";
import {
  Image, Platform, Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle, Defs,
  Ellipse, G, Line,
  Path,
  Rect,
  Stop, LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { colors, fonts, shadowMd, shadowSm } from "./theme";

// ─── Data ────────────────────────────────────────────────────────────────────

const USER = {
  name: "Sofía",
  handle: "@sofia_cooks",
  initials: "SC",
  tier: "Home Cook",
  nextTier: "Sous Chef",
  tierProgress: 0.62,
  recipes: 23,
  friends: 6,
  streak: 5,
  img: "https://images.unsplash.com/photo-1556910636-c508da52e01c?w=160&h=160&fit=crop&auto=format",
};

const FRIENDS: { id: number; name: string; initials: string; color: string; streak: number; img?: string }[] = [
  { id: 1, name: "Maya", initials: "MK", color: "#D9A28B", streak: 12, img: "https://images.unsplash.com/photo-1625631980683-825234bfb7d5?w=64&h=64&fit=crop&auto=format" },
  { id: 2, name: "Tomás", initials: "TR", color: "#687B5D", streak: 7 },
  { id: 3, name: "Priya", initials: "PN", color: "#9B6B2A", streak: 21, img: "https://images.unsplash.com/photo-1625631980722-b728f9cf1036?w=64&h=64&fit=crop&auto=format" },
  { id: 4, name: "Lena", initials: "LW", color: "#8A9E7A", streak: 0 },
  { id: 5, name: "Carlos", initials: "CR", color: "#B5603A", streak: 9, img: "https://images.unsplash.com/photo-1625631980777-823fc2938950?w=64&h=64&fit=crop&auto=format" },
  { id: 6, name: "Sun", initials: "SY", color: "#7A7A72", streak: 2 },
];

const CREATED_RECIPES = [
  { id: 1, title: "Golden Garlic Pasta", img: "https://images.unsplash.com/photo-1617474020181-e1d42f2245ea?w=300&h=240&fit=crop&auto=format" },
  { id: 2, title: "Tomato Shakshuka", img: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=240&fit=crop&auto=format" },
  { id: 3, title: "Smoky Lentil Bowl", img: "https://images.unsplash.com/photo-1667473775795-41f69ae72c44?w=300&h=240&fit=crop&auto=format" },
  { id: 4, title: "Herb Roast Chicken", img: "https://images.unsplash.com/photo-1737625854730-56e11fcaff17?w=300&h=240&fit=crop&auto=format" },
  { id: 5, title: "Fried Egg Toast", img: "https://images.unsplash.com/photo-1465014925804-7b9ede58d0d7?w=300&h=240&fit=crop&auto=format" },
  { id: 6, title: "Yellow Fried Rice", img: "https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=300&h=240&fit=crop&auto=format" },
];

const COOKED_RECIPES = [
  { id: 7, title: "Pad Thai Noodles", img: "https://images.unsplash.com/photo-1788601299617-3052a7c8fa70?w=300&h=240&fit=crop&auto=format" },
  { id: 8, title: "Cacio e Pepe", img: "https://images.unsplash.com/photo-1707546944460-dda9069b9c1e?w=300&h=240&fit=crop&auto=format" },
  { id: 9, title: "Veggie Grain Bowl", img: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=300&h=240&fit=crop&auto=format" },
  { id: 10, title: "Spiced Ramen Bowl", img: "https://images.unsplash.com/photo-1773817728515-612df7f78e1b?w=300&h=240&fit=crop&auto=format" },
];

type LibraryRecipe = (typeof CREATED_RECIPES)[number];

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
  const [activeTab, setActiveTab] = useState<TabId>("created");
  const [editMode, setEditMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<LibraryRecipe | null>(null);

  const layoutWidth = Platform.OS === "web" ? Math.min(width, 430) : width;
  const cardWidth = (layoutWidth - 32 - 12) / 2;

  const tabRecipes: Record<TabId, typeof CREATED_RECIPES> = {
    created: CREATED_RECIPES,
    cooked: COOKED_RECIPES,
    liked: [],
  };
  const recipes = tabRecipes[activeTab];

  const handleOpenRecipe = (recipe: LibraryRecipe) => {
    if (onOpenRecipe) {
      onOpenRecipe(String(recipe.id));
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const stats = [
    { label: "Recipes", value: String(USER.recipes) },
    { label: "Friends", value: String(USER.friends) },
    { label: "Streak", value: `${USER.streak}🔥` },
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
                  <Image source={{ uri: USER.img }} style={styles.fill} resizeMode="cover" />
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
              <TextInput defaultValue={USER.name} style={styles.nameInput} />
            ) : (
              <Text style={styles.name}>{USER.name}</Text>
            )}
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.faint }}>{USER.handle}</Text>
          </View>

          {/* Tier badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: colors.sageLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.sage }}>{USER.tier}</Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: colors.faint }}>→ {USER.nextTier}</Text>
          </View>

          {/* Progress */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Progress to {USER.nextTier}
              </Text>
              <Text style={{ fontSize: 9, fontWeight: "700", color: colors.sage }}>
                {Math.round(USER.tierProgress * 100)}%
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.divider, borderRadius: 999, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${USER.tierProgress * 100}%`, backgroundColor: colors.sage, borderRadius: 999 }} />
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
          {FRIENDS.map((f) => (
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
          <View style={{ alignItems: "center", gap: 6 }}>
            <Pressable style={styles.addFriend}>
              <Text style={{ fontSize: 18, color: colors.faint }}>+</Text>
            </Pressable>
            <Text style={{ fontSize: 9, fontWeight: "600", color: colors.faint }}>Add</Text>
          </View>
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
          {recipes.length === 0 ? (
            <EmptyTabState tab={activeTab} />
          ) : (
            recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={{ id: String(r.id), title: r.title, difficulty: "Beginner Cook", imageUrl: r.img, likes: 0, views: 0 }}
                width={cardWidth}
                compact
                onPress={() => handleOpenRecipe(r)}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
    <RecipePreviewModal
      recipe={selectedRecipe ? {
        id: String(selectedRecipe.id),
        title: selectedRecipe.title,
        difficulty: "Beginner Cook",
        imageUrl: selectedRecipe.img,
        likes: 0,
        views: 0,
      } : null}
      visible={selectedRecipe !== null}
      onClose={() => setSelectedRecipe(null)}
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