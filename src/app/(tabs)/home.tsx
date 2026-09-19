import { useRouter } from "expo-router";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostCard } from "@/components/cards/post-card";
import { PostGrid } from "@/components/cards/post-grid";
import { StreakCard } from "@/components/cards/streak-card";
import { SectionHeading } from "@/components/section-heading";
import { TabHeader } from "@/components/tab-header";
import { AppTheme } from "@/constants/app-theme";
import { resolvePostImageUrl, usePostFeed } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import { toPostCardProps } from "@/lib/post-card-data";
import { fetchFriends, fetchUserProfile, get_recommended_posts } from "@/services/api";
import type { Post } from "@/types/models";
import { useEffect, useState } from "react";

type Friend = Record<string, unknown>;

export default function HomeScreen() {
	const router = useRouter();
	const { currentUser } = useAuthContext();
	const { posts, loading: postsLoading } = usePostFeed({ limit: 8 });
	const [friends, setFriends] = useState<Friend[]>([]);
	const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
	const [recommendedLoading, setRecommendedLoading] = useState(true);
	const [streak, setStreak] = useState(0);
	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";

	useEffect(() => {
		if (!currentUser) return;
		let active = true;
		const userId = currentUser.id;
		async function loadCommunity() {
			const [profileResult, friendsResult] = await Promise.allSettled([
				fetchUserProfile(userId),
				fetchFriends(),
			]);
			if (!active) return;
			if (profileResult.status === "fulfilled" && profileResult.value) {
				setStreak(
					Number(
						profileResult.value.streakCount ??
							profileResult.value.streakcount ??
							0,
					),
				);
			}
			if (friendsResult.status === "fulfilled")
				setFriends((friendsResult.value || []) as Friend[]);
		}
		void loadCommunity();
		return () => {
			active = false;
		};
	}, [currentUser]);

	useEffect(() => {
		let active = true;
		async function loadRecommended() {
			try {
				const matches = await get_recommended_posts();
				if (!active) return;
				const resolvedMatches = await Promise.all(
					(matches || []).map(async (post) => ({
						...post,
						image_url: await resolvePostImageUrl(post.image_url),
					})),
				);
				setRecommendedPosts(resolvedMatches);
			} catch {
				if (!active) return;
				setRecommendedPosts([]);
			} finally {
				if (active) setRecommendedLoading(false);
			}
		}
		void loadRecommended();
		return () => {
			active = false;
		};
	}, []);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<TabHeader
					eyebrow="Good morning"
					title={`Hey, ${firstName}.`}
					subtitle="A little progress tastes good."
					initial={firstName.charAt(0).toUpperCase()}
					onSettingsPress={() => router.push("/settings")}
				/>
				<StreakCard
					days={streak}
					note={
						streak
							? "Keep your cooking rhythm going."
							: "Share a recipe to start your streak."
					}
				/>
				<View style={styles.section}>
					<SectionHeading
						title="Recommended for you"
						subtitle="Hand-picked matches based on your tastes."
					/>
				</View>
				{recommendedLoading ? (
					<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
				) : recommendedPosts.length ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.recommendedRow}
					>
						{recommendedPosts.slice(0, 6).map((post) => (
							<View style={styles.recommendedCard} key={post.id}>
								<PostCard {...toPostCardProps(post)} />
							</View>
						))}
					</ScrollView>
				) : (
					<Text style={styles.empty}>No recommendations yet. Try updating your preferences.</Text>
				)}
				<View style={styles.section}>
					<SectionHeading
						title="Your circle"
						subtitle={`${friends.length} friend${friends.length === 1 ? "" : "s"} connected`}
						rightContent={
							<Text style={styles.count}>{friends.length}</Text>
						}
					/>
				</View>
				{friends.length ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.friends}
					>
						{friends.slice(0, 8).map((friend, index) => {
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
										friend.id || friend.friend_id || index,
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
					</ScrollView>
				) : (
					<Text style={styles.empty}>
						Your friends will appear here when you connect with
						them.
					</Text>
				)}
				<View style={[styles.section, styles.recipeSection]}>
					<SectionHeading
						title="Latest recipes"
						subtitle="Fresh posts from the community."
					/>
				</View>
				{postsLoading ? (
					<ActivityIndicator
						color={AppTheme.accent}
						style={styles.loading}
					/>
				) : posts.length ? (
					<PostGrid posts={posts} />
				) : (
					<Text style={styles.empty}>
						No recipes have been shared yet.
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
	section: { marginTop: 28, marginBottom: 14 },
	recipeSection: { marginTop: 32 },
	count: { color: AppTheme.accent, fontSize: 14, fontWeight: "600" },
	friends: { gap: 16, paddingRight: 20 },
	friend: { width: 58, alignItems: "center" },
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
		maxWidth: 58,
	},
	recommendedRow: { gap: 16, paddingRight: 20, paddingBottom: 8 },
	recommendedCard: { width: 290 },
	loading: { marginTop: 24 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21 },
});
