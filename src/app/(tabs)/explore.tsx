import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipePreviewModal } from "@/components/recipes/recipe-preview-modal";
import { ScreenHeader } from "@/components/screen-header";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, fonts, shadowSm } from "./theme";

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
}

const ALL_RECIPES: GridRecipe[] = [
  { id: 1, title: "Cacio e Pepe", author: "Marta V.", authorAvatar: "🧑‍🍳", time: "18 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1707546944460-dda9069b9c1e?w=400&h=300&fit=crop&auto=format", tags: ["italian"], likes: 42 },
  { id: 2, title: "Pad Thai Noodles", author: "Kenji T.", authorAvatar: "👨‍🍳", time: "25 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1788601299617-3052a7c8fa70?w=400&h=300&fit=crop&auto=format", tags: ["thai", "vegan"], likes: 67 },
  { id: 3, title: "Street Taco Bowl", author: "Rosa M.", authorAvatar: "👩‍🍳", time: "20 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1533606117812-0783e8e690f1?w=400&h=300&fit=crop&auto=format", tags: ["mexican", "friends"], likes: 31 },
  { id: 4, title: "Shrimp Noodle Stir-fry", author: "Alex D.", authorAvatar: "🧑", time: "20 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1783196736270-d08d63485303?w=400&h=300&fit=crop&auto=format", tags: ["thai", "glutenfree"], likes: 28 },
  { id: 5, title: "Veggie Grain Bowl", author: "Priya N.", authorAvatar: "👩", time: "15 min", difficulty: "Beginner", img: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "glutenfree", "friends"], likes: 55 },
  { id: 6, title: "Seafood Paella", author: "Carlos R.", authorAvatar: "👨", time: "50 min", difficulty: "Hard", img: "https://images.unsplash.com/photo-1528712518629-67d42968a45e?w=400&h=300&fit=crop&auto=format", tags: ["friends"], likes: 89 },
  { id: 7, title: "Yellow Fried Rice", author: "Sun Y.", authorAvatar: "🧑‍🍳", time: "15 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "glutenfree"], likes: 19 },
  { id: 8, title: "Table-Style Mezze", author: "Layla H.", authorAvatar: "👩", time: "35 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1681038560284-58214f7ea0ac?w=400&h=300&fit=crop&auto=format", tags: ["vegan", "friends"], likes: 44 },
  { id: 9, title: "Spiced Ramen Bowl", author: "Tomás R.", authorAvatar: "👨‍🍳", time: "35 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1773817728515-612df7f78e1b?w=400&h=300&fit=crop&auto=format", tags: ["thai", "friends"], likes: 76 },
  { id: 10, title: "Community Rice Feast", author: "Amara S.", authorAvatar: "🧑", time: "45 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1776855828611-8fd3ee069df1?w=400&h=300&fit=crop&auto=format", tags: ["glutenfree", "friends"], likes: 103 },
];

const GRID_PADDING = 16;
const GRID_GAP = 12;

function normalizeFilterTag(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ExploreScreen({ onOpenRecipe }: { onOpenRecipe?: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<GridRecipe | null>(null);
  const { dietaryOptions, cuisineOptions, loading: filtersLoading } = useRecipeOptions();

  const filterOptions = useMemo(() => [
    { id: "all", label: "All recipes", tag: "all", group: "all" as const },
    ...cuisineOptions.map((option) => ({ id: `cuisine-${option.id}`, label: option.name, tag: normalizeFilterTag(option.name), group: "cuisine" as const })),
    ...dietaryOptions.map((option) => ({ id: `dietary-${option.id}`, label: option.name, tag: normalizeFilterTag(option.name), group: "dietary" as const })),
  ], [cuisineOptions, dietaryOptions]);

  const layoutWidth = Platform.OS === "web" ? Math.min(width, 430) : width;
  const fullWidth = layoutWidth - GRID_PADDING * 2;
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
      <ScreenHeader eyebrow="The community table" title="Explore" subtitle="Real recipes from your BetterBite community." />

      <View style={styles.searchRow}>
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
        <Pressable
          onPress={() => setFilterOpen(true)}
          style={({ pressed }) => [styles.filterButton, activeFilter !== "all" && styles.filterButtonActive, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Open recipe filters"
          accessibilityState={{ expanded: filterOpen }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={activeFilter !== "all" ? "#fff" : colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </Svg>
        </Pressable>
      </View>

      {/* SECTION HEADING */}
      <View style={[styles.rowBetween, { paddingHorizontal: 16, marginBottom: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16 }}>🍽️</Text>
          <Text style={{ fontSize: 14, fontWeight: "800", color: colors.ink }}>
            {filterOptions.find((filter) => filter.tag === activeFilter)?.label ?? "All recipes"}
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
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: String(recipe.id),
                  title: recipe.title,
                  difficulty: recipe.difficulty,
                  time: recipe.time,
                  imageUrl: recipe.img,
                  likes: recipe.likes,
                  views: 0,
                  author: recipe.author,
                }}
                width={halfWidth}
                onPress={() => onOpenRecipe ? onOpenRecipe(String(recipe.id)) : setSelectedRecipe(recipe)}
              />
            ))}
          </View>
        )}
      </View>
      <RecipePreviewModal
        recipe={selectedRecipe ? {
          id: String(selectedRecipe.id),
          title: selectedRecipe.title,
          difficulty: selectedRecipe.difficulty,
          time: selectedRecipe.time,
          imageUrl: selectedRecipe.img,
          likes: selectedRecipe.likes,
          views: 0,
          author: selectedRecipe.author,
        } : null}
        visible={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
      />
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.filterModalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} accessibilityRole="button" accessibilityLabel="Close recipe filters" />
          <View style={[styles.filterMenu, shadowSm]}>
            <View style={styles.filterMenuHeader}>
              <Text style={styles.filterMenuTitle}>Filter recipes</Text>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close recipe filters">
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            {filtersLoading ? (
              <ActivityIndicator color={colors.sage} style={styles.filterLoading} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                <Pressable
                  onPress={() => { setActiveFilter("all"); setFilterOpen(false); }}
                  style={[styles.filterOption, activeFilter === "all" && styles.filterOptionActive]}
                >
                  <Text style={[styles.filterOptionText, activeFilter === "all" && styles.filterOptionTextActive]}>All recipes</Text>
                </Pressable>
                {(["cuisine", "dietary"] as const).map((group) => {
                  const options = filterOptions.filter((filter) => filter.group === group);
                  return (
                    <View key={group} style={styles.filterGroup}>
                      <Text style={styles.filterGroupTitle}>{group === "cuisine" ? "Cuisine" : "Dietary"}</Text>
                      {options.map((filter) => (
                        <Pressable
                          key={filter.id}
                          onPress={() => { setActiveFilter(filter.tag); setFilterOpen(false); }}
                          style={[styles.filterOption, activeFilter === filter.tag && styles.filterOptionActive]}
                        >
                          <Text style={[styles.filterOptionText, activeFilter === filter.tag && styles.filterOptionTextActive]}>{filter.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  searchFocused: { borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.ink, padding: 0 },
  filterButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  filterButtonActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  filterModalRoot: { flex: 1, justifyContent: "flex-start", paddingTop: 150, paddingHorizontal: 16, backgroundColor: "rgba(48,49,46,0.3)" },
  filterMenu: { width: "100%", maxHeight: "70%", borderRadius: 16, backgroundColor: "#fff", overflow: "hidden" },
  filterMenuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  filterMenuTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  closeText: { fontSize: 26, lineHeight: 28, color: colors.muted },
  filterLoading: { height: 160 },
  filterList: { padding: 16, gap: 8 },
  filterGroup: { gap: 8, marginTop: 8 },
  filterGroupTitle: { marginBottom: 2, fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.2 },
  filterOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bg },
  filterOptionActive: { backgroundColor: colors.sage },
  filterOptionText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  filterOptionTextActive: { color: "#fff" },

  countPill: { backgroundColor: colors.divider, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countText: { fontSize: 12, fontWeight: "600", color: colors.muted },

});