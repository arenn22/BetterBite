import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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
    DEFAULT_PROFILE_IMAGE,
    fetchFriends,
    fetchUserProfile,
    get_liked_posts,
} from "@/services/api";
import type { Post } from "@/types/models";
import { useEffect, useState } from "react";

type Friend = Record<string, unknown>;
type RecipeTab = "created" | "cooked" | "liked";

export default function ProfileScreen() {
	const { currentUser } = useAuthContext();
	const { posts, loading } = usePostFeed({
		authorId: currentUser?.id,
		enabled: Boolean(currentUser),
	});
	const [profile, setProfile] = useState(currentUser);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [likedPosts, setLikedPosts] = useState<Post[]>([]);
	const [likedLoading, setLikedLoading] = useState(false);
	const [activeRecipeTab, setActiveRecipeTab] = useState<RecipeTab>("created");

	const loadLikedPosts = async () => {
		setLikedLoading(true);
		try {
			const posts = await get_liked_posts();
			setLikedPosts(posts || []);
		} catch (error) {
			console.error("Error loading liked posts:", error);
			setLikedPosts([]);
		} finally {
			setLikedLoading(false);
		}
	};

	useEffect(() => {
		if (!currentUser) return;
		let active = true;
		setLikedPosts([]);
		Promise.allSettled([
			fetchUserProfile(currentUser.id),
			fetchFriends(),
		]).then(([profileResult, friendsResult]) => {
			if (!active) return;
			if (profileResult.status === "fulfilled")
				setProfile(profileResult.value || currentUser);
			if (friendsResult.status === "fulfilled")
				setFriends((friendsResult.value || []) as Friend[]);
		});
		void loadLikedPosts();
		return () => {
			active = false;
		};
	}, [currentUser]);

	if (!currentUser)
		return (
			<SafeAreaView style={styles.safeArea}>
				<Text style={styles.empty}>Sign in to view your profile.</Text>
			</SafeAreaView>
		);
	const publicProfile = profile || currentUser;
	const streak = Number(
		publicProfile.streakCount ?? publicProfile.streakcount ?? 0,
	);
	const firstName = publicProfile.username.charAt(0).toUpperCase();
	const activePosts = activeRecipeTab === "created" ? posts : likedPosts;
	const activeLoading = activeRecipeTab === "created" ? loading : likedLoading;
	const tabLabels: Record<RecipeTab, string> = {
		created: "Created",
		cooked: "Cooked",
		liked: "Liked",
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<TabHeader
					eyebrow="Your account"
					title="Profile"
					subtitle="Your food, friends, and progress in one place."
					initial={firstName}
				/>
				<View style={styles.profileCard}>
					<Image
						accessibilityLabel={`${publicProfile.username}'s profile picture`}
						source={{
							uri:
								publicProfile.pfp_url?.trim() ||
								DEFAULT_PROFILE_IMAGE,
						}}
						style={styles.avatar}
					/>
					<Text style={styles.displayName}>
						{publicProfile.username}
					</Text>
					<View style={styles.stats}>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{posts.length}</Text>
							<Text style={styles.statLabel}>Recipes</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>
								{friends.length}
							</Text>
							<Text style={styles.statLabel}>Friends</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{streak}</Text>
							<Text style={styles.statLabel}>Streak</Text>
						</View>
					</View>
				</View>
				<View style={styles.section}>
					<SectionHeading
						title="Your friends"
						subtitle="People you share the table with."
					/>
					{friends.length ? (
						<View style={styles.friendList}>
							{friends.slice(0, 12).map((friend, index) => {
								const name = String(
									friend.username ||
										friend.display_name ||
										friend.friend_username ||
										"Friend",
								);
								return (
									<View
										style={styles.friend}
										key={String(
											friend.id ||
												friend.friend_id ||
												index,
										)}
									>
										<View style={styles.friendAvatar}>
											<Text style={styles.friendInitial}>
												{name.charAt(0).toUpperCase()}
											</Text>
										</View>
										<Text
											style={styles.friendName}
											numberOfLines={1}
										>
											{name}
										</Text>
									</View>
								);
							})}
						</View>
					) : (
						<Text style={styles.empty}>
							Connect with friends to see them here.
						</Text>
					)}
				</View>
				<View style={styles.section}>
					<SectionHeading
						title="Your recipe library"
						subtitle="Recipes connected to your account."
					/>
					<View style={styles.recipeTabs}>
						{(Object.keys(tabLabels) as RecipeTab[]).map((tab) => (
							<Pressable
								key={tab}
								onPress={() => {
									if (tab === "liked") {
										void loadLikedPosts();
									}
									setActiveRecipeTab(tab);
								}}
								accessibilityRole="tab"
								accessibilityState={{ selected: activeRecipeTab === tab }}
								style={[
									styles.recipeTab,
									activeRecipeTab === tab && styles.activeRecipeTab,
								]}
							>
								<Text
									style={[
										styles.recipeTabText,
										activeRecipeTab === tab && styles.activeRecipeTabText,
									]}
								>
									{tabLabels[tab]}
								</Text>
							</Pressable>
						))}
					</View>
					{activeRecipeTab === "cooked" ? (
						<Text style={styles.empty}>
							Cooked recipes will appear here once a backend cooking-history function is available.
						</Text>
					) : activeLoading ? (
						<ActivityIndicator
							color={AppTheme.accent}
							style={styles.loading}
						/>
					) : activePosts.length ? (
						<PostGrid posts={activePosts} />
					) : (
						<Text style={styles.empty}>
							{activeRecipeTab === "liked"
								? "Recipes you like will appear here."
								: "Your published recipes will appear here."}
						</Text>
					)}
				</View>
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
		paddingBottom: 40,
	},
	profileCard: {
		backgroundColor: AppTheme.surface,
		borderRadius: 12,
		alignItems: "center",
		padding: 22,
		borderWidth: 1,
		borderColor: AppTheme.border,
	},
	avatar: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: AppTheme.warmSoft,
		borderColor: AppTheme.card,
		borderWidth: 4,
	},
	displayName: {
		color: AppTheme.text,
		fontSize: 22,
		fontWeight: "600",
		marginTop: 13,
	},
	email: { color: AppTheme.muted, fontSize: 13, marginTop: 4 },
	stats: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "space-around",
		marginTop: 22,
		paddingTop: 18,
		borderTopWidth: 1,
		borderTopColor: AppTheme.border,
	},
	stat: { alignItems: "center" },
	statValue: { color: AppTheme.accent, fontSize: 21, fontWeight: "600" },
	statLabel: { color: AppTheme.muted, fontSize: 12, marginTop: 4 },
	section: { marginTop: 28 },
	friendList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 14,
		marginTop: 14,
	},
	friend: { alignItems: "center", width: 64 },
	friendAvatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	friendInitial: { color: AppTheme.accent, fontSize: 15, fontWeight: "600" },
	friendName: {
		color: AppTheme.muted,
		fontSize: 11,
		marginTop: 6,
		maxWidth: 64,
		textAlign: "center",
	},
	recipeTabs: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: AppTheme.border,
		marginTop: 18,
		marginBottom: 18,
	},
	recipeTab: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	activeRecipeTab: { borderBottomColor: AppTheme.accent },
	recipeTabText: {
		color: AppTheme.muted,
		fontSize: 13,
		fontWeight: "600",
	},
	activeRecipeTabText: { color: AppTheme.accent },
	loading: { marginTop: 20 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21 },
});
