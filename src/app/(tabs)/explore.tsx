import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
    Image, Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, fonts, shadowSm } from "./theme";

const FILTERS = [
  { id: "all", label: "All", emoji: null },
  { id: "friends", label: "Friends", emoji: "👥" },
  { id: "italian", label: "Italian", emoji: "🍝" },
  { id: "mexican", label: "Mexican", emoji: "🌮" },
  { id: "thai", label: "Thai", emoji: "🍜" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "glutenfree", label: "Gluten-Free", emoji: "🌾" },
];

interface GridRecipe {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  time: string;
  difficulty: string;
  img: string;
  tags: string[];
  likes: number;
  wide?: boolean;
}

const ALL_RECIPES: GridRecipe[] = [
  { id: 1, title: "Cacio e Pepe", author: "Marta V.", authorAvatar: "🧑‍🍳", time: "18 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1707546944460-dda9069b9c1e?w=400&h=300&fit=crop&auto=format", tags: ["italian"], likes: 42 },
  { id: 2, title: "Pad Thai Noodles", author: "Kenji T.", authorAvatar: "👨‍🍳", time: "25 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1788601299617-3052a7c8fa70?w=400&h=300&fit=crop&auto=format", tags: ["thai", "vegan"], likes: 67, wide: true },
  { id: 3, title: "Street Taco Bowl", author: "Rosa M.", authorAvatar: "👩‍🍳", time: "20 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1533606117812-0783e8e690f1?w=400&h=300&fit=crop&auto=format", tags: ["mexican", "friends"], likes: 31 },
  { id: 4, title: "Shrimp Noodle Stir-fry", author: "Alex D.", authorAvatar: "🧑", time: "20 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1783196736270-d08d63485303?w=400&h=300&fit=crop&auto=format", tags: ["thai", "glutenfree"], likes: 28 },
  { id: 5, title: "Veggie Grain Bowl", author: "Priya N.", authorAvatar: "👩", time: "15 min", difficulty: "Beginner", img: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "glutenfree", "friends"], likes: 55 },
  { id: 6, title: "Seafood Paella", author: "Carlos R.", authorAvatar: "👨", time: "50 min", difficulty: "Hard", img: "https://images.unsplash.com/photo-1528712518629-67d42968a45e?w=400&h=300&fit=crop&auto=format", tags: ["friends"], likes: 89, wide: true },
  { id: 7, title: "Yellow Fried Rice", author: "Sun Y.", authorAvatar: "🧑‍🍳", time: "15 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "glutenfree"], likes: 19 },
  { id: 8, title: "Table-Style Mezze", author: "Layla H.", authorAvatar: "👩", time: "35 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1681038560284-58214f7ea0ac?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "friends"], likes: 44 },
  { id: 9, title: "Spiced Ramen Bowl", author: "Tomás R.", authorAvatar: "👨‍🍳", time: "35 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1773817728515-612df7f78e1b?w=400&h=300&fit=crop&auto=format", tags: ["thai", "friends"], likes: 76 },
  { id: 10, title: "Community Rice Feast", author: "Amara S.", authorAvatar: "🧑", time: "45 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1776855828611-8fd3ee069df1?w=400&h=300&fit=crop&auto=format", tags: ["glutenfree", "friends"], likes: 103, wide: true },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#687B5D",
  Easy: "#687B5D",
  Medium: "#C4855F",
  Hard: "#B5603A",
};

const GRID_PADDING = 16;
const GRID_GAP = 12;

function GridCard({
  recipe, cardWidth, onOpen,
}: { recipe: GridRecipe; cardWidth: number; onOpen: (id: number) => void }) {
  return (
    <Pressable
      onPress={() => onOpen(recipe.id)}
      style={({ pressed }) => [styles.gridCard, shadowSm, { width: cardWidth }, pressed && { opacity: 0.92 }]}
    >
      <View style={{ height: recipe.wide ? 176 : 128, backgroundColor: colors.sageLight, overflow: "hidden" }}>
        <Image source={{ uri: recipe.img }} style={styles.fill} resizeMode="cover" />
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={2} style={styles.gridTitle}>{recipe.title}</Text>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12 }}>{recipe.authorAvatar}</Text>
            <Text style={styles.author}>{recipe.author}</Text>
          </View>
          <Text style={styles.time}>{recipe.time}</Text>
        </View>
        <Text style={[styles.diff, { color: DIFFICULTY_COLORS[recipe.difficulty] ?? colors.sage }]}>
          {recipe.difficulty}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen({ onOpenRecipe }: { onOpenRecipe?: (id: number) => void }) {
  const { width } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fullWidth = width - GRID_PADDING * 2;
  const halfWidth = (fullWidth - GRID_GAP) / 2;

  const filtered = useMemo(() => {
    let results = ALL_RECIPES;
    if (activeFilter !== "all") {
      results = results.filter((r) => r.tags.includes(activeFilter));
    }
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      results = results.filter(
        (r) => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
      );
    }
    return results;
  }, [activeFilter, searchValue]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* HEADER */}
      <View style={{ paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={styles.eyebrow}>The community table</Text>
        <Text style={styles.h1}>Explore</Text>
        <Text style={styles.subtitle}>Real recipes from your BetterBite community.</Text>
      </View>

      {/* SEARCH */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={[styles.search, shadowSm, searchFocused && styles.searchFocused]}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={11} cy={11} r={8} />
            <Path d="m21 21-4.35-4.35" />
          </Svg>
          <TextInput
            placeholder="Search dishes, cuisines, or friends"
            placeholderTextColor={colors.faint}
            value={searchValue}
            onChangeText={setSearchValue}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
          />
          {!!searchValue && (
            <Pressable onPress={() => setSearchValue("")} hitSlop={8}>
              <Text style={{ color: colors.faint, fontSize: 12 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 20 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              {f.emoji && <Text style={{ fontSize: 14 }}>{f.emoji}</Text>}
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.ink }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* FEATURED HERO CARD */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Pressable onPress={() => onOpenRecipe?.(2)} style={styles.hero}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1542308743-cf8a20da4beb?w=800&h=420&fit=crop&auto=format" }}
            style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(196,133,95,0)", "rgba(196,133,95,0.2)", "rgba(122,58,24,0.8)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBlob} />
          <View style={styles.heroInner}>
            <View style={styles.rowBetween}>
              <View style={styles.heroBadge}>
                <Text style={{ fontSize: 12 }}>🏆</Text>
                <Text style={styles.heroBadgeText}>Challenge Pick</Text>
              </View>
              <View style={styles.heroHeart}>
                <Text style={{ fontSize: 14 }}>🤍</Text>
              </View>
            </View>
            <View>
              <Text style={styles.heroEyebrow}>Community's Top This Week</Text>
              <Text style={styles.heroTitle}>One-Pan Chicken & Rice</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>👩‍🍳</Text>
                  <Text style={styles.heroMeta}>by Maya K.</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.4)" }}>·</Text>
                <Text style={styles.heroMeta}>35 min · Medium</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)" }}>·</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>❤️</Text>
                  <Text style={[styles.heroMeta, { fontWeight: "600" }]}>214</Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      {/* SECTION HEADING */}
      <View style={[styles.rowBetween, { paddingHorizontal: 16, marginBottom: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16 }}>🍽️</Text>
          <Text style={{ fontSize: 14, fontWeight: "800", color: colors.ink }}>
            {activeFilter === "all" ? "All recipes" : FILTERS.find((f) => f.id === activeFilter)?.label}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} found
          </Text>
        </View>
      </View>

      {/* RECIPE GRID */}
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text style={{ fontSize: 30, marginBottom: 12 }}>🥄</Text>
            <Text style={{ fontFamily: fonts.headingSemi, fontSize: 18, color: colors.ink, marginBottom: 4 }}>
              Nothing found
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.muted }}>
              Try a different filter or search term.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
            {filtered.map((recipe) => (
              <GridCard
                key={recipe.id}
                recipe={recipe}
                cardWidth={recipe.wide ? fullWidth : halfWidth}
                onOpen={onOpenRecipe ?? (() => {})}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  h1: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4 },

  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  searchFocused: { borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.ink, padding: 0 },

  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  chipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  chipText: { fontSize: 12, fontWeight: "700" },

  hero: { height: 208, borderRadius: 16, overflow: "hidden", backgroundColor: colors.clay },
  heroBlob: { position: "absolute", top: -32, right: -32, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(196,133,95,0.3)" },
  heroInner: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: "space-between" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },
  heroHeart: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroEyebrow: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 24, color: "#fff", marginBottom: 4 },
  heroMeta: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.85)" },

  countPill: { backgroundColor: colors.divider, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countText: { fontSize: 12, fontWeight: "600", color: colors.muted },

  gridCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  gridTitle: { fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 16, marginBottom: 6 },
  author: { fontSize: 10, fontWeight: "500", color: colors.muted },
  time: { fontSize: 10, fontWeight: "500", color: colors.faint },
  diff: { fontSize: 10, fontWeight: "700", marginTop: 6 },
});