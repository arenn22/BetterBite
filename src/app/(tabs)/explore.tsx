import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTheme } from "@/constants/app-theme";
import { resolvePostImageUrl, usePostFeed } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
    fetchCuisines,
    fetchDietaryRestrictions,
    fetchFriends,
    fetchPostByCuisines,
    fetchPostsByDietaryRestrictions,
    likePost,
} from "@/services/api";
import type { Post } from "@/types/models";
import { useEffect, useState } from "react";

type Option = { id: number; name: string };
type Friend = Record<string, unknown>;
type FilterOption = {
	key: string;
	label: string;
	kind: "friends" | "category";
	id?: number;
	field?: "cuisineIds" | "restrictionIds";
};

function filterIcon(filter: FilterOption) {
	if (filter.key === "friends") return "👥";
	if (filter.key === "all") return "";
	const label = filter.label.toLowerCase();
	if (label.includes("ital")) return "🍝";
	if (label.includes("mexic") || label.includes("taco")) return "🌮";
	if (label.includes("thai") || label.includes("noodle")) return "🍜";
	if (label.includes("vegan") || label.includes("veget")) return "🌱";
	if (label.includes("gluten")) return "🌾";
	return "🍽️";
}

function PostImage({ imageUrl, title, featured = false }: { imageUrl?: string; title: string; featured?: boolean }) {
	const [resolvedImageUrl, setResolvedImageUrl] = useState(imageUrl || "");

	useEffect(() => {
		let active = true;
		void resolvePostImageUrl(imageUrl).then((url) => {
			if (active) setResolvedImageUrl(url || imageUrl || "");
		});
		return () => {
			active = false;
		};
	}, [imageUrl]);

	return resolvedImageUrl ? (
		<Image accessibilityLabel={title} source={{ uri: resolvedImageUrl }} style={featured ? styles.featuredImage : styles.cardImage} />
	) : (
		<View style={featured ? styles.featuredImage : styles.cardImage} />
	);
}

function RecipeCard({ post, wide, userId }: { post: Post; wide?: boolean; userId?: string }) {
	const [liked, setLiked] = useState(false);
	const [likeTotal, setLikeTotal] = useState(post.likes || 0);
	const [liking, setLiking] = useState(false);
	const username = post.author_username || "BetterBite member";

	async function handleLike() {
		if (liked || liking || !post.id) return;
		setLiking(true);
		try {
			await likePost(post.id, userId || "");
			setLiked(true);
			setLikeTotal((count) => count + 1);
		} finally {
			setLiking(false);
		}
	}

	return (
		<View style={[styles.recipeCard, wide && styles.wideCard]}>
			<View style={styles.cardImageWrap}>
				<PostImage imageUrl={post.image_url} title={post.title} />
				<Pressable accessibilityLabel={liked ? "Recipe liked" : "Like recipe"} onPress={() => void handleLike()} style={styles.likeButton}>
					<Text style={styles.likeIcon}>{liked ? "❤️" : "🤍"}</Text>
				</Pressable>
			</View>
			<View style={styles.cardBody}>
				<Text numberOfLines={2} style={styles.cardTitle}>{post.title || "Untitled recipe"}</Text>
				<View style={styles.cardMetaRow}>
					<View style={styles.authorRow}>
						<Text style={styles.authorAvatar}>{username.charAt(0).toUpperCase()}</Text>
						<Text numberOfLines={1} style={styles.authorName}>{username}</Text>
					</View>
					<Text style={styles.likes}>❤️ {likeTotal}</Text>
				</View>
				<View style={styles.cardMetaRow}>
					<Text style={[styles.difficulty, difficultyStyle(post.difficulty)]}>{difficultyLabel(post.difficulty)}</Text>
					<Text style={styles.time}>{formatPostTime(post.date_created)}</Text>
				</View>
			</View>
		</View>
	);
}

function difficultyLabel(value: number) {
	if (value <= 1) return "Beginner";
	if (value === 2) return "Easy";
	if (value === 3) return "Medium";
	return "Hard";
}

function difficultyStyle(value: number) {
	if (value >= 4) return styles.hard;
	if (value === 3) return styles.medium;
	return styles.easy;
}

function formatPostTime(value: Date | string | undefined) {
	if (!value) return "Recently";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Recently";
	const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hr ago`;
	return `${Math.round(hours / 24)} days ago`;
}

export default function ExploreScreen() {
	const { currentUser } = useAuthContext();
	const { posts, loading } = usePostFeed({ limit: 30 });
	const [friends, setFriends] = useState<Friend[]>([]);
	const [categories, setCategories] = useState<FilterOption[]>([]);
	const [query, setQuery] = useState("");
	const [selectedFilters, setSelectedFilters] = useState(["all"]);
	const [visiblePosts, setVisiblePosts] = useState<Post[]>([]);

	useEffect(() => {
		let active = true;
		Promise.allSettled([
			fetchCuisines(),
			fetchDietaryRestrictions(),
			fetchFriends(),
		]).then(([cuisines, restrictions, friendsResult]) => {
			if (!active) return;
			const options = new Map<string, FilterOption>();
			if (cuisines.status === "fulfilled") {
				cuisines.value.forEach((option: Option) => {
					options.set(`cuisine-${option.id}`, {
						key: `cuisine-${option.id}`,
						label: option.name,
						kind: "category",
						id: option.id,
						field: "cuisineIds",
					});
				});
			}
			if (restrictions.status === "fulfilled") {
				restrictions.value.forEach((option: Option) => {
					options.set(`restriction-${option.id}`, {
						key: `restriction-${option.id}`,
						label: option.name,
						kind: "category",
						id: option.id,
						field: "restrictionIds",
					});
				});
			}
			setCategories([...options.values()]);
			if (friendsResult.status === "fulfilled")
				setFriends((friendsResult.value || []) as Friend[]);
		});
		return () => {
			active = false;
		};
	}, [currentUser]);
	const filters: FilterOption[] = [
		{ key: "all", label: "All", kind: "category" },
		{ key: "friends", label: "Friends", kind: "friends" },
		...categories,
	];

	useEffect(() => {
		let active = true;
		async function resolveVisiblePosts() {
			const search = query.trim().toLowerCase();
			const friendNames = new Set(
				friends.map((friend) =>
					String(
						friend.username ||
							friend.display_name ||
							friend.friend_username ||
							"",
					).toLowerCase(),
				),
			);
			const selectedCuisineIds = categories
				.filter(
					(category) =>
						selectedFilters.includes(category.key) &&
						category.field === "cuisineIds" &&
						category.id !== undefined,
				)
				.map((category) => category.id as number);
			const selectedRestrictionIds = categories
				.filter(
					(category) =>
						selectedFilters.includes(category.key) &&
						category.field === "restrictionIds" &&
						category.id !== undefined,
				)
				.map((category) => category.id as number);
			const hasCategorySelection = selectedCuisineIds.length > 0 || selectedRestrictionIds.length > 0;
			const hasFriendSelection = selectedFilters.includes("friends");
			const showAll = selectedFilters.includes("all");

			const dedupePosts = (items: Post[]) => {
				const unique = new Map<string, Post>();
				for (const item of items) {
					if (!item?.id) continue;
					unique.set(item.id, item);
				}
				return [...unique.values()];
			};

			let nextPosts: Post[] = showAll ? [...posts] : [];

			if (hasCategorySelection) {
				const [cuisineMatches, restrictionMatches] = await Promise.all([
					selectedCuisineIds.length ? fetchPostByCuisines(selectedCuisineIds) : Promise.resolve([] as Post[]),
					selectedRestrictionIds.length ? fetchPostsByDietaryRestrictions(selectedRestrictionIds) : Promise.resolve([] as Post[]),
				]);
				const categoryMatches = dedupePosts([...cuisineMatches, ...restrictionMatches]);
				const categoryMatchIds = new Set(categoryMatches.map((post) => post.id));
				nextPosts = showAll
					? posts.filter((post) => categoryMatchIds.has(post.id) || categoryMatches.length === 0)
					: categoryMatches;
			}

			if (hasFriendSelection) {
				const friendMatches = dedupePosts(
					posts.filter((post) =>
						friendNames.has((post.author_username || "").toLowerCase()),
					),
				);
				const friendMatchIds = new Set(friendMatches.map((post) => post.id));
				nextPosts = nextPosts.length
					? dedupePosts(nextPosts.filter((post) => friendMatchIds.has(post.id)))
					: friendMatches;
			}

			if (!showAll && !hasCategorySelection && !hasFriendSelection) {
				nextPosts = [...posts];
			}

			if (search) {
				nextPosts = nextPosts.filter((post) => {
					const searchable = [
						post.title,
						post.description,
						post.author_username,
					].filter(Boolean).join(" ").toLowerCase();
					return searchable.includes(search);
				});
			}

			if (!active) return;
			setVisiblePosts(dedupePosts(nextPosts));
		}

		void resolveVisiblePosts();
		return () => {
			active = false;
		};
	}, [categories, friends, posts, query, selectedFilters]);

	function toggleFilter(key: string) {
		if (key === "all") {
			setSelectedFilters(["all"]);
			return;
		}
		setSelectedFilters((current) => {
			const withoutAll = current.filter((item) => item !== "all");
			const next = withoutAll.includes(key)
				? withoutAll.filter((item) => item !== key)
				: [...withoutAll, key];
			return next.length ? next : ["all"];
		});
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Text style={styles.eyebrow}>The community table</Text>
					<Text style={styles.title}>Explore</Text>
					<Text style={styles.subtitle}>Real recipes from your BetterBite community.</Text>
				</View>
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search dishes, cuisines, or friends"
					placeholderTextColor={AppTheme.muted}
					style={styles.search}
				/>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filters}
				>
					{filters.map((filter) => (
						<Pressable
							key={filter.key}
							onPress={() => toggleFilter(filter.key)}
							style={[
								styles.filter,
								selectedFilters.includes(filter.key) &&
									styles.selectedFilter,
							]}
						>
							<Text style={styles.filterIcon}>{filterIcon(filter)}</Text>
							<Text
								style={[
									styles.filterText,
									selectedFilters.includes(filter.key) &&
										styles.selectedFilterText,
								]}
							>
								{filter.label}
							</Text>
						</Pressable>
					))}
				</ScrollView>
				{visiblePosts.length > 0 ? (
					<View style={styles.featuredWrap}>
						<View style={styles.featuredCard}>
							<PostImage imageUrl={visiblePosts[0].image_url} title={visiblePosts[0].title} featured />
							<View style={styles.featuredOverlay} />
							<View style={styles.featuredContent}>
								<Text style={styles.featuredBadge}>🏆  COMMUNITY PICK</Text>
								<View>
									<Text style={styles.featuredEyebrow}>Community's top this week</Text>
									<Text numberOfLines={2} style={styles.featuredTitle}>{visiblePosts[0].title || "Community recipe"}</Text>
									<Text style={styles.featuredMeta}>by {visiblePosts[0].author_username || "BetterBite member"}  ·  {difficultyLabel(visiblePosts[0].difficulty)}  ·  ❤️ {visiblePosts[0].likes || 0}</Text>
								</View>
							</View>
						</View>
					</View>
				) : null}
				<View style={styles.heading}>
					<View style={styles.headingTitleRow}>
						<Text style={styles.headingIcon}>🍽️</Text>
						<Text style={styles.headingTitle}>{selectedFilters.includes("friends") ? "From your friends" : "All recipes"}</Text>
					</View>
					<Text style={styles.count}>{visiblePosts.length} recipe{visiblePosts.length === 1 ? "" : "s"} found</Text>
				</View>
				{loading ? (
					<ActivityIndicator
						color={AppTheme.accent}
						style={styles.loading}
					/>
				) : visiblePosts.length ? (
					<View style={styles.recipeGrid}>
						{visiblePosts.map((post, index) => (
							<RecipeCard key={post.id} post={post} wide={index % 5 === 1 || index % 5 === 4} userId={currentUser?.id} />
						))}
					</View>
				) : (
					<Text style={styles.empty}>
						No recipes match this search yet.
					</Text>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F7F7F4" },
	content: {
		width: "100%",
		maxWidth: 640,
		alignSelf: "center",
		paddingHorizontal: 16,
		paddingBottom: 44,
	},
	header: { paddingTop: 18, paddingBottom: 16 },
	eyebrow: { color: AppTheme.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
	title: { color: AppTheme.text, fontSize: 34, fontWeight: "700", marginTop: 3 },
	subtitle: { color: AppTheme.muted, fontSize: 14, fontWeight: "500", marginTop: 4 },
	search: {
		height: 48,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: AppTheme.border,
		backgroundColor: "#FFFFFF",
		color: AppTheme.text,
		paddingHorizontal: 16,
		fontSize: 14,
	},
	filters: { gap: 8, paddingVertical: 16, paddingRight: 16 },
	filter: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 18,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: AppTheme.border,
		paddingHorizontal: 13,
		paddingVertical: 8,
	},
	selectedFilter: {
		backgroundColor: AppTheme.accent,
		borderColor: AppTheme.accent,
	},
	filterIcon: { fontSize: 14, marginRight: 5 },
	filterText: { color: AppTheme.text, fontSize: 12, fontWeight: "700" },
	selectedFilterText: { color: "#FFFFFF" },
	featuredWrap: { marginBottom: 20 },
	featuredCard: { height: 208, borderRadius: 17, overflow: "hidden", backgroundColor: AppTheme.warm },
	featuredImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
	featuredOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(92, 43, 20, 0.52)" },
	featuredContent: { ...StyleSheet.absoluteFill, padding: 15, justifyContent: "space-between" },
	featuredBadge: { alignSelf: "flex-start", color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.23)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
	featuredEyebrow: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
	featuredTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "700", lineHeight: 29, marginBottom: 5 },
	featuredMeta: { color: "rgba(255,255,255,0.86)", fontSize: 11, fontWeight: "500" },
	heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
	headingTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
	headingIcon: { fontSize: 16 },
	headingTitle: { color: AppTheme.text, fontSize: 15, fontWeight: "800" },
	count: { color: AppTheme.muted, backgroundColor: "#ECECE7", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: "700" },
	recipeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11, justifyContent: "space-between" },
	recipeCard: { width: "48.2%", overflow: "hidden", borderRadius: 15, borderWidth: 1, borderColor: "#E5E5E0", backgroundColor: "#FFFFFF" },
	wideCard: { width: "100%" },
	cardImageWrap: { height: 132, overflow: "hidden", backgroundColor: "#E8EDE5" },
	cardImage: { width: "100%", height: "100%", backgroundColor: "#E8EDE5" },
	likeButton: { position: "absolute", top: 8, right: 8, width: 29, height: 29, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" },
	likeIcon: { fontSize: 14 },
	cardBody: { padding: 10 },
	cardTitle: { color: AppTheme.text, fontSize: 12, fontWeight: "800", lineHeight: 16, minHeight: 32, marginBottom: 7 },
	cardMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
	authorRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5, paddingRight: 4 },
	authorAvatar: { width: 18, height: 18, borderRadius: 9, textAlign: "center", textAlignVertical: "center", color: AppTheme.warm, backgroundColor: AppTheme.warmSoft, fontSize: 9, fontWeight: "800" },
	authorName: { flex: 1, color: AppTheme.muted, fontSize: 10, fontWeight: "500" },
	likes: { color: AppTheme.muted, fontSize: 10, fontWeight: "600" },
	difficulty: { fontSize: 10, fontWeight: "800" },
	easy: { color: AppTheme.accent },
	medium: { color: "#C4855F" },
	hard: { color: "#B5603A" },
	time: { color: "#ADADAA", fontSize: 10, fontWeight: "500" },
	loading: { marginTop: 24 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21, textAlign: "center", paddingVertical: 46 },
});
