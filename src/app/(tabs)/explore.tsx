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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { PressableScale } from "@/components/ui/pressable-scale";
import { TagChip } from "@/components/ui/tag-chip";
import { colors, layout, radii, shadowLg, shadowSm } from "./theme";

const GRID_PADDING = 16;
const GRID_GAP = 12;
/** Cards never get narrower than this; extra width goes into more columns. */
const MIN_CARD_WIDTH = 160;

/** Evenly sized columns that exactly fill the measured grid width. */
function getGridLayout(gridWidth: number) {
  const columns = Math.max(2, Math.floor((gridWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const cardWidth = Math.floor((gridWidth - GRID_GAP * (columns - 1)) / columns);
  return { columns, cardWidth };
}

const TIME_FILTERS: { id: string; label: string; icon: IconName; maxMinutes: number | undefined }[] = [
  { id: "all", label: "Any time", icon: "clock", maxMinutes: undefined },
  { id: "max-15", label: "15 min", icon: "bolt", maxMinutes: 15 },
  { id: "max-30", label: "30 min", icon: "timer", maxMinutes: 30 },
  { id: "max-45", label: "45 min", icon: "pan", maxMinutes: 45 },
  { id: "max-60", label: "60 min", icon: "flame", maxMinutes: 60 },
];

const DIFFICULTY_FILTERS: { id: number; label: string; icon: IconName }[] = EXPERIENCE_LEVEL_NAMES.map((name, index) => ({
  id: index + 1,
  label: name,
  icon: index < 3 ? "sprout" : index < 6 ? "pan" : index < 9 ? "flame" : "trophy",
}));

export default function ExploreScreen({ onOpenRecipe }: { onOpenRecipe?: (id: string) => void }) {
  const [selectedCuisineFilters, setSelectedCuisineFilters] = useState<Set<number>>(new Set());
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<Set<number>>(new Set());
  const [selectedDifficultyFilters, setSelectedDifficultyFilters] = useState<Set<number>>(new Set());
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("all");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filterSearchValue, setFilterSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCardData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<string>>(new Set());
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
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
  }, [retryCount]);

  const cuisineFilters = useMemo(() => cuisineOptions.map((option) => ({ id: option.id, label: option.name })), [cuisineOptions]);
  const dietaryFilters = useMemo(() => dietaryOptions.map((option) => ({ id: option.id, label: option.name })), [dietaryOptions]);
  const normalizedFilterSearch = filterSearchValue.trim().toLowerCase();
  const visibleCuisineFilters = cuisineFilters.filter((filter) => !normalizedFilterSearch || filter.label.toLowerCase().includes(normalizedFilterSearch));
  const visibleDietaryFilters = dietaryFilters.filter((filter) => !normalizedFilterSearch || filter.label.toLowerCase().includes(normalizedFilterSearch));
  const visibleDifficultyFilters = DIFFICULTY_FILTERS.filter((filter) => !normalizedFilterSearch || filter.label.toLowerCase().includes(normalizedFilterSearch));

  const hasActiveFilters = selectedCuisineFilters.size > 0
    || selectedDietaryFilters.size > 0
    || selectedDifficultyFilters.size > 0
    || selectedTimeFilter !== "all"
    || friendsOnly;
  const activeFilterCount = selectedCuisineFilters.size
    + selectedDietaryFilters.size
    + selectedDifficultyFilters.size
    + (selectedTimeFilter !== "all" ? 1 : 0)
    + (friendsOnly ? 1 : 0);

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

  const [gridWidth, setGridWidth] = useState(0);
  const { cardWidth } = getGridLayout(gridWidth);

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
        if (isCurrentRequest) {
          setPostsLoading(false);
          setRefreshing(false);
        }
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
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 90 }}
      refreshControl={Platform.OS === "web" ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setRetryCount((count) => count + 1);
          }}
          tintColor={colors.sage}
          colors={[colors.sage]}
        />
      )}
    >
      <ScreenHeader title="Explore" />

      <FadeIn delay={60} style={styles.searchRow}>
        <View style={[styles.search, shadowSm, searchFocused && styles.searchFocused]}>
          <AppIcon name="search" size={17} color={searchFocused ? colors.sage : colors.muted} />
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
            <PressableScale onPress={() => setSearchValue("")} hitSlop={8} style={styles.clearCircle} hoverStyle={styles.clearCircleHover} accessibilityRole="button" accessibilityLabel="Clear search">
              <AppIcon name="close" size={11} color={colors.muted} weight="bold" />
            </PressableScale>
          )}
        </View>
        <PressableScale
          onPress={() => setFilterOpen(true)}
          style={[styles.filterButton, shadowSm, hasActiveFilters && styles.filterButtonActive]}
          hoverStyle={hasActiveFilters ? styles.filterButtonActiveHover : styles.filterButtonHover}
          pressScale={0.92}
          accessibilityRole="button"
          accessibilityLabel="Open recipe filters"
          accessibilityState={{ expanded: filterOpen }}
        >
          <AppIcon name="filter" size={19} color={hasActiveFilters ? "#fff" : colors.ink} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </PressableScale>
      </FadeIn>

      {/* SECTION HEADING */}
      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingLeft}>
          <IconBadge name="forkKnife" size={34} />
          <Text style={styles.sectionTitle}>
            {hasActiveFilters ? "Filtered recipes" : "All recipes"}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {postsLoading ? "Loading…" : `${filtered.length} recipe${filtered.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* RECIPE GRID */}
      <View style={{ paddingHorizontal: GRID_PADDING }} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width - GRID_PADDING * 2)}>
        {postsLoading ? (
          <ActivityIndicator color={colors.sage} style={styles.filterLoading} />
        ) : postsError ? (
          <EmptyState
            tone="error"
            icon="refresh"
            title="Could not load recipes"
            message={postsError}
            action={<Button title="Try again" icon="refresh" size="sm" onPress={() => setRetryCount((count) => count + 1)} />}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nothing found"
            message="Try a different filter or search term."
            action={hasActiveFilters ? <Button title="Clear filters" variant="outline" icon="close" size="sm" onPress={clearFilters} /> : undefined}
          />
        ) : gridWidth <= 0 ? null : (
          <View style={styles.grid}>
            {filtered.map((recipe, index) => {
              const authorId = recipe.post?.profile_id;
              return (
                <FadeIn key={recipe.id} delay={Math.min(index, 8) * 50}>
                  <RecipeCard
                    recipe={recipe}
                    width={cardWidth}
                    onPress={() => handleOpenRecipe(recipe)}
                    onAuthorPress={authorId ? () => router.push(`/profile/${authorId}`) : undefined}
                  />
                </FadeIn>
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
          <Animated.View entering={FadeInDown.duration(280)} style={[styles.filterMenu, shadowLg]}>
            <View style={styles.filterMenuHeader}>
              <View style={styles.sectionHeadingLeft}>
                <IconBadge name="filter" size={30} />
                <Text style={styles.filterMenuTitle}>Filter recipes</Text>
              </View>
              <PressableScale onPress={() => setFilterOpen(false)} hitSlop={8} style={styles.closeButton} hoverStyle={styles.closeButtonHover} accessibilityRole="button" accessibilityLabel="Close recipe filters">
                <AppIcon name="close" size={15} color={colors.muted} weight="bold" />
              </PressableScale>
            </View>
            <View style={styles.filterSearch}>
              <AppIcon name="search" size={15} color={colors.muted} />
              <TextInput
                value={filterSearchValue}
                onChangeText={setFilterSearchValue}
                placeholder="Search filter options"
                placeholderTextColor={colors.faint}
                style={styles.filterSearchInput}
              />
              {!!filterSearchValue && (
                <PressableScale onPress={() => setFilterSearchValue("")} hitSlop={8} style={styles.clearCircle} hoverStyle={styles.clearCircleHover} accessibilityRole="button" accessibilityLabel="Clear filter search">
                  <AppIcon name="close" size={11} color={colors.muted} weight="bold" />
                </PressableScale>
              )}
            </View>
            {filtersLoading ? (
              <ActivityIndicator color={colors.sage} style={styles.filterLoading} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                <View>
                  <SectionLabel icon="clock">Time</SectionLabel>
                  <View style={styles.filterChipRow}>
                    {TIME_FILTERS.map((filter) => (
                      <TagChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedTimeFilter === filter.id}
                        onPress={() => setSelectedTimeFilter(filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View>
                  <SectionLabel icon="globe">Cuisine</SectionLabel>
                  <View style={styles.filterChipRow}>
                    {visibleCuisineFilters.map((filter) => (
                      <TagChip
                        key={filter.id}
                        kind="cuisine"
                        label={filter.label}
                        selected={selectedCuisineFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedCuisineFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View>
                  <SectionLabel icon="leaf">Dietary</SectionLabel>
                  <View style={styles.filterChipRow}>
                    {visibleDietaryFilters.map((filter) => (
                      <TagChip
                        key={filter.id}
                        kind="dietary"
                        label={filter.label}
                        selected={selectedDietaryFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedDietaryFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View>
                  <SectionLabel icon="chart">Difficulty</SectionLabel>
                  <View style={styles.filterChipRow}>
                    {visibleDifficultyFilters.map((filter) => (
                      <TagChip
                        key={filter.id}
                        icon={filter.icon}
                        label={filter.label}
                        selected={selectedDifficultyFilters.has(filter.id)}
                        onPress={() => toggleFilter(setSelectedDifficultyFilters, filter.id)}
                      />
                    ))}
                  </View>
                </View>
                <View>
                  <SectionLabel icon="social">Friends</SectionLabel>
                  <View style={styles.filterChipRow}>
                    <TagChip
                      icon="social"
                      label="Friends only"
                      selected={friendsOnly}
                      onPress={() => setFriendsOnly((selected) => !selected)}
                    />
                  </View>
                </View>
              </ScrollView>
            )}
            <View style={styles.filterMenuFooter}>
              <Button title="Clear all" variant="ghost" size="sm" icon="close" onPress={clearFilters} disabled={!hasActiveFilters} />
              <Button title="Done" size="sm" icon="check" onPress={() => setFilterOpen(false)} />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: layout.gutter, marginBottom: 20 },
  search: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10 },
  searchFocused: { borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.ink, padding: 0 },
  clearCircle: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.divider },
  clearCircleHover: { backgroundColor: colors.border },
  filterButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  filterButtonHover: { borderColor: colors.sageMid, backgroundColor: colors.bg },
  filterButtonActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  filterButtonActiveHover: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  filterCount: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.flame, borderWidth: 2, borderColor: colors.bg },
  filterCountText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: layout.gutter, marginBottom: 12 },
  sectionHeadingLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: GRID_GAP, rowGap: GRID_GAP, paddingTop: 4, paddingBottom: 8 },
  filterSearch: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.bg },
  filterSearchInput: { flex: 1, padding: 0, color: colors.ink, fontSize: 13 },
  filterModalRoot: { flex: 1, justifyContent: "flex-start", paddingTop: 120, paddingHorizontal: 16, backgroundColor: "rgba(48,49,46,0.35)" },
  filterMenu: { width: "100%", maxWidth: 560, alignSelf: "center", maxHeight: "75%", borderRadius: radii.xl, backgroundColor: colors.card, overflow: "hidden" },
  filterMenuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  filterMenuTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  closeButtonHover: { backgroundColor: colors.divider },
  filterLoading: { height: 160 },
  filterList: { padding: 16, gap: 18 },
  filterChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterMenuFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  countPill: { backgroundColor: colors.sageLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  countText: { fontSize: 12, fontWeight: "700", color: colors.sage },
});
