import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostGrid } from "@/components/cards/post-grid";
import { SectionHeading } from "@/components/section-heading";
import { TabHeader } from "@/components/tab-header";
import { AppTheme } from "@/constants/app-theme";
import { usePostFeed } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
	fetchCuisines,
	fetchDietaryRestrictions,
	fetchFriends,
	fetchPostByCuisines,
	fetchPostsByDietaryRestrictions,
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
	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";
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
				<TabHeader
					eyebrow="The community table"
					title="Explore"
					subtitle="Real recipes from your BetterBite community."
					initial={firstName.charAt(0).toUpperCase()}
				/>
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
				<View style={styles.heading}>
					<SectionHeading
						title={selectedFilters.includes("friends") ? "From your friends" : "Community recipes"}
						subtitle={`${visiblePosts.length} recipe${visiblePosts.length === 1 ? "" : "s"} found.`}
						rightContent={
							<Text style={styles.count}>
								{visiblePosts.length}
							</Text>
						}
					/>
				</View>
				{loading ? (
					<ActivityIndicator
						color={AppTheme.accent}
						style={styles.loading}
					/>
				) : visiblePosts.length ? (
					<PostGrid posts={visiblePosts} />
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
	safeArea: { flex: 1, backgroundColor: AppTheme.background },
	content: {
		width: "100%",
		maxWidth: 640,
		alignSelf: "center",
		paddingHorizontal: 20,
		paddingBottom: 36,
	},
	search: {
		height: 50,
		borderRadius: 9,
		borderWidth: 1,
		borderColor: AppTheme.border,
		backgroundColor: AppTheme.surface,
		color: AppTheme.text,
		paddingHorizontal: 15,
		fontSize: 15,
	},
	filters: { gap: 8, paddingVertical: 18, paddingRight: 20 },
	filter: {
		borderRadius: 9,
		backgroundColor: AppTheme.surface,
		borderWidth: 1,
		borderColor: AppTheme.border,
		paddingHorizontal: 13,
		paddingVertical: 9,
	},
	selectedFilter: {
		backgroundColor: AppTheme.accent,
		borderColor: AppTheme.accent,
	},
	filterText: { color: AppTheme.muted, fontSize: 13 },
	selectedFilterText: { color: "#FFFFFF" },
	heading: { marginBottom: 14 },
	count: { color: AppTheme.accent, fontSize: 14, fontWeight: "600" },
	loading: { marginTop: 24 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21 },
});
