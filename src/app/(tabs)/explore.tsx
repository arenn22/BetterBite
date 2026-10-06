import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeDetailsModal } from "@/components/recipe-details-modal";
import { ScreenHeader } from "@/components/screen-header";
import { EXPERIENCE_LEVEL_NAMES } from "@/constants/experience-levels";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
import { useAuthContext } from "@/lib/auth/auth-context";
import { toRecipeCardData, updateRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { fetchFilteredPosts, getLikedPostsByUser, incrementPostViews, likePost, unlikePost } from "@/services/api/posts";
import type { Post } from "@/types/models";
import { router } from "expo-router";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
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

const GRID_PADDING = 16;
const GRID_GAP = 12;

const TIME_FILTERS = [
  { id: "all", label: "Any time", icon: "⏱️", maxMinutes: undefined },
  { id: "max-15", label: "15 min", icon: "⚡", maxMinutes: 15 },
  { id: "max-30", label: "30 min", icon: "🕒", maxMinutes: 30 },
  { id: "max-45", label: "45 min", icon: "🍳", maxMinutes: 45 },
  { id: "max-60", label: "60 min", icon: "🔥", maxMinutes: 60 },
] as const;

const DIFFICULTY_FILTERS = EXPERIENCE_LEVEL_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  label: name,
  icon: index < 3 ? "🌱" : index < 6 ? "🍳" : "🔥",
}));

const FILTER_EMOJIS: Record<string, string> = {
  vegan: "🌱",
  vegetarian: "🥦",
  glutenfree: "🌾",
  dairyfree: "🥛",
  keto: "🥩",
  paleo: "🍖",
  italian: "🍝",
  mexican: "🌮",
  thai: "🍜",
  indian: "🍛",
  japanese: "🍱",
  french: "🥐",
  american: "🍔",
  mediterranean: "🫒",
  chinese: "🥟",
};

function normalizeFilterTag(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function FilterChip({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.filterChipIcon}>{icon}</Text>
      <Text numberOfLines={1} style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function ExploreScreen({ onOpenRecipe }: { onOpenRecipe?: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const [selectedCuisineFilters, setSelectedCuisineFilters] = useState<Set<number>>(new Set());
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<Set<number>>(new Set());
  const [selectedDifficultyFilters, setSelectedDifficultyFilters] = useState<Set<number>>(new Set());
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCardData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<string>>(new Set());
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { dietaryOptions, cuisineOptions, loading: filtersLoading } = useRecipeOptions();
  const { currentUser } = useAuthContext();

  useEffect(() => {
    let active = true;
    void getLikedPostsByUser()
      .then((likedPosts) => {
        if (active) setLikedPostIds(new Set(likedPosts.map((post) => post.id)));
      })
      .catch((error: unknown) => {
        if (active) console.error("Unable to load liked posts:", error);
      });
    return () => { active = false; };
  }, []);

  const cuisineFilters = useMemo(() => cuisineOptions.map((option) => ({
    id: option.id,
    label: option.name,
    icon: FILTER_EMOJIS[normalizeFilterTag(option.name)] ?? "🍽️",
  })), [cuisineOptions]);
  const dietaryFilters = useMemo(() => dietaryOptions.map((option) => ({
    id: option.id,
    label: option.name,
    icon: FILTER_EMOJIS[normalizeFilterTag(option.name)] ?? "🥗",
  })), [dietaryOptions]);

  const hasActiveFilters = selectedCuisineFilters.size > 0
    || selectedDietaryFilters.size > 0
    || selectedDifficultyFilters.size > 0
    || selectedTimeFilter !== "all"
    || friendsOnly;

  const toggleFilter = (setter: Dispatch<SetStateAction<Set<number>>>, value: number) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCuisineFilters(new Set());
    setSelectedDietaryFilters(new Set());
    setSelectedDifficultyFilters(new Set());
    setSelectedTimeFilter("all");
    setFriendsOnly(false);
  };

  const layoutWidth = Platform.OS === "web" ? Math.min(width, 430) : width;
  const fullWidth = layoutWidth - GRID_PADDING * 2;
  const halfWidth = (fullWidth - GRID_GAP) / 2;

  const maximumTime = TIME_FILTERS.find((filter) => filter.id === selectedTimeFilter)?.maxMinutes;

  const handleOpenRecipe = (recipe: RecipeCardData) => {
    if (onOpenRecipe) {
      onOpenRecipe(recipe.id);
      return;
    }

    setSelectedRecipe(recipe);
    void incrementPostViews(recipe.id)
      .then(() => {
        setPosts((previous) => previous.map((post) => post.id === recipe.id
          ? { ...post, views: Number(post.views || 0) + 1 }
          : post));
        setSelectedRecipe((previous) => previous?.id === recipe.id
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
      setPosts((previous) => previous.map((post) => post.id === postId
        ? { ...post, likes: Math.max(0, Number(post.likes || 0) + likesChange) }
        : post));
      setSelectedRecipe((previous) => previous?.id === postId
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

  useEffect(() => {
    let isCurrentRequest = true;

    const loadFilteredPosts = async () => {
      setPostsLoading(true);
      setPostsError(null);
      try {
        const result = await fetchFilteredPosts({
          cuisineIds: [...selectedCuisineFilters],
          dietaryRestrictionIds: [...selectedDietaryFilters],
          difficulties: [...selectedDifficultyFilters],
          maxTime: maximumTime,
          friendsOnly,
        });
        if (isCurrentRequest) setPosts(result);
      } catch (error) {
        if (isCurrentRequest) {
          setPostsError(error instanceof Error ? error.message : "Could not load recipes.");
        }
      } finally {
        if (isCurrentRequest) setPostsLoading(false);
      }
    };

    void loadFilteredPosts();
    return () => {
      isCurrentRequest = false;
    };
  }, [
    friendsOnly,
    maximumTime,
    retryCount,
    selectedCuisineFilters,
    selectedDietaryFilters,
    selectedDifficultyFilters,
  ]);

  const filtered = useMemo(() => {
    let results = posts.map((post) => toRecipeCardData(post, true));
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      results = results.filter(
        (recipe) => recipe.title.toLowerCase().includes(q) || recipe.author?.toLowerCase().includes(q)
      );
    }
    return results;
  }, [posts, searchValue]);

  const selectedAuthorId = selectedRecipe?.post?.profile_id;

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
          style={({ pressed }) => [styles.filterButton, hasActiveFilters && styles.filterButtonActive, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Open recipe filters"
          accessibilityState={{ expanded: filterOpen }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={hasActiveFilters ? "#fff" : colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </Svg>
        </Pressable>
      </View>

      {/* SECTION HEADING */}
      <View style={[styles.rowBetween, { paddingHorizontal: 16, marginBottom: 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16 }}>🍽️</Text>
          <Text style={{ fontSize: 14, fontWeight: "800", color: colors.ink }}>
            {hasActiveFilters ? "Filtered recipes" : "All recipes"}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {postsLoading ? "Loading recipes…" : `${filtered.length} recipe${filtered.length !== 1 ? "s" : ""} found`}
          </Text>
        </View>
      </View>

      {/* RECIPE GRID */}
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        {postsLoading ? (
          <ActivityIndicator color={colors.sage} style={styles.filterLoading} />
        ) : postsError ? (
          <View style={{ alignItems: "center", paddingVertical: 48, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, textAlign: "center" }}>
              Could not load recipes: {postsError}
            </Text>
            <Pressable onPress={() => setRetryCount((count) => count + 1)} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
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
            {filtered.map((recipe) => {
              const authorId = recipe.post?.profile_id;
              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  width={halfWidth}
                  onPress={() => handleOpenRecipe(recipe)}
                  onAuthorPress={authorId ? () => router.push(`/profile/${authorId}`) : undefined}
                />
              );
            })}
          </View>
        )}
      </View>
      <RecipeDetailsModal
        post={selectedRecipe?.post ?? null}
        visible={selectedRecipe !== null}
        difficulty={selectedRecipe?.difficulty ?? ""}
        cookingTime={selectedRecipe?.time}
        likes={selectedRecipe?.likes ?? 0}
        views={selectedRecipe?.views ?? 0}
        liked={selectedRecipe ? likedPostIds.has(selectedRecipe.id) : false}
        likeLoading={selectedRecipe ? likeLoadingIds.has(selectedRecipe.id) : false}
        onClose={() => setSelectedRecipe(null)}
        onLike={(currentlyLiked) => selectedRecipe ? handleLikePost(selectedRecipe.id, currentlyLiked) : Promise.resolve()}
        onAuthorPress={selectedAuthorId ? () => router.push(`/profile/${selectedAuthorId}`) : undefined}
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
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Time</Text>
                  <View style={styles.filterChipRow}>
                    {TIME_FILTERS.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedTimeFilter === filter.id}
                        onPress={() => setSelectedTimeFilter(filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Cuisine</Text>
                  <View style={styles.filterChipRow}>
                    {cuisineFilters.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedCuisineFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedCuisineFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Dietary</Text>
                  <View style={styles.filterChipRow}>
                    {dietaryFilters.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedDietaryFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedDietaryFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Difficulty</Text>
                  <View style={styles.filterChipRow}>
                    {DIFFICULTY_FILTERS.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedDifficultyFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedDifficultyFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Friends</Text>
                  <View style={styles.filterChipRow}>
                    <FilterChip
                      icon="👥"
                      label="Friends only"
                      selected={friendsOnly}
                      onPress={() => setFriendsOnly((selected) => !selected)}
                    />
                  </View>
                </View>
              </ScrollView>
            )}
            <View style={styles.filterMenuFooter}>
              <Pressable onPress={clearFilters} disabled={!hasActiveFilters} style={styles.clearButton}>
                <Text style={[styles.clearButtonText, !hasActiveFilters && styles.clearButtonTextDisabled]}>Clear all</Text>
              </Pressable>
              <Pressable onPress={() => setFilterOpen(false)} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
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
  filterChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  filterChipSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  filterChipIcon: { fontSize: 13 },
  filterChipText: { maxWidth: 130, fontSize: 11, fontWeight: "700", color: colors.ink },
  filterChipTextSelected: { color: "#fff" },
  filterMenuFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  clearButton: { paddingVertical: 8, paddingHorizontal: 4 },
  clearButtonText: { fontSize: 12, fontWeight: "700", color: colors.terracotta },
  clearButtonTextDisabled: { color: colors.ghost },
  doneButton: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.sage },
  doneButtonText: { fontSize: 12, fontWeight: "800", color: "#fff" },

  countPill: { backgroundColor: colors.divider, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countText: { fontSize: 12, fontWeight: "600", color: colors.muted },

});