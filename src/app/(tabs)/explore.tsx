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
} from "@/services/api";
import { useEffect, useMemo, useState } from "react";

type Option = { id: number; name: string };
type Friend = Record<string, unknown>;

export default function ExploreScreen() {
	const { currentUser } = useAuthContext();
	const { posts, loading } = usePostFeed({ limit: 30 });
	const [friends, setFriends] = useState<Friend[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [query, setQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");

	useEffect(() => {
		let active = true;
		Promise.allSettled([
			fetchCuisines(),
			fetchDietaryRestrictions(),
			fetchFriends(),
		]).then(([cuisines, restrictions, friendsResult]) => {
			if (!active) return;
			const options: Option[] = [];
			if (cuisines.status === "fulfilled")
				options.push(...cuisines.value);
			if (restrictions.status === "fulfilled")
				options.push(...restrictions.value);
			setCategories([...new Set(options.map((option) => option.name))]);
			if (friendsResult.status === "fulfilled")
				setFriends((friendsResult.value || []) as Friend[]);
		});
		return () => {
			active = false;
		};
	}, [currentUser]);

	const visiblePosts = useMemo(() => {
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
		return posts.filter((post) => {
			const searchable = [
				post.title,
				post.description,
				post.author_username,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			const matchesSearch = !search || searchable.includes(search);
			if (selectedCategory === "Friends")
				return (
					matchesSearch &&
					friendNames.has((post.author_username || "").toLowerCase())
				);
			return (
				matchesSearch &&
				(selectedCategory === "All" ||
					searchable.includes(selectedCategory.toLowerCase()))
			);
		});
	}, [friends, posts, query, selectedCategory]);
	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";
	const filters = ["All", "Friends", ...categories];

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
					{filters.map((category) => (
						<Pressable
							key={category}
							onPress={() => setSelectedCategory(category)}
							style={[
								styles.filter,
								selectedCategory === category &&
									styles.selectedFilter,
							]}
						>
							<Text
								style={[
									styles.filterText,
									selectedCategory === category &&
										styles.selectedFilterText,
								]}
							>
								{category}
							</Text>
						</Pressable>
					))}
				</ScrollView>
				<View style={styles.heading}>
					<SectionHeading
						title={
							selectedCategory === "Friends"
								? "From your friends"
								: "Community recipes"
						}
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
	content: { paddingHorizontal: 20, paddingBottom: 36 },
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
