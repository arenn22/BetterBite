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
import { StreakCard } from "@/components/cards/streak-card";
import { SectionHeading } from "@/components/section-heading";
import { TabHeader } from "@/components/tab-header";
import { AppTheme } from "@/constants/app-theme";
import { resolvePostImageUrl } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import { toPostCardProps } from "@/lib/post-card-data";
import {
    fetchUserProfile,
    get_challenge_posts,
    get_easy_posts,
    get_friend_posts,
    get_recommended_posts,
} from "@/services/api";
import type { Post } from "@/types/models";
import { useEffect, useState } from "react";

export default function HomeScreen() {
	const router = useRouter();
	const { currentUser } = useAuthContext();
	const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
	const [recommendedLoading, setRecommendedLoading] = useState(true);
	const [easyPosts, setEasyPosts] = useState<Post[]>([]);
	const [easyLoading, setEasyLoading] = useState(true);
	const [challengePosts, setChallengePosts] = useState<Post[]>([]);
	const [challengeLoading, setChallengeLoading] = useState(true);
	const [friendPosts, setFriendPosts] = useState<Post[]>([]);
	const [friendLoading, setFriendLoading] = useState(true);
	const [streak, setStreak] = useState(0);
	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";

	useEffect(() => {
		if (!currentUser) return;
		let active = true;
		const userId = currentUser.id;
		async function loadCommunity() {
			const profileResult = await Promise.allSettled([fetchUserProfile(userId)]);
			if (!active) return;
			if (profileResult[0].status === "fulfilled" && profileResult[0].value) {
				setStreak(
					Number(
						profileResult[0].value.streakCount ??
							profileResult[0].value.streakcount ??
							0,
					),
				);
			}
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

	useEffect(() => {
		let active = true;
		async function loadSection(
			fetcher: () => Promise<Post[]>,
			setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
			setLoading: React.Dispatch<React.SetStateAction<boolean>>,
		) {
			try {
				const matches = await fetcher();
				if (!active) return;
				const resolvedMatches = await Promise.all(
					(matches || []).map(async (post) => ({
						...post,
						image_url: await resolvePostImageUrl(post.image_url),
					})),
				);
				setPosts(resolvedMatches);
			} catch {
				if (!active) return;
				setPosts([]);
			} finally {
				if (active) setLoading(false);
			}
		}

		void Promise.all([
			loadSection(get_easy_posts, setEasyPosts, setEasyLoading),
			loadSection(get_challenge_posts, setChallengePosts, setChallengeLoading),
			loadSection(get_friend_posts, setFriendPosts, setFriendLoading),
		]);

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
						contentContainerStyle={styles.horizontalRow}
					>
						{recommendedPosts.slice(0, 6).map((post) => (
							<View style={styles.horizontalCard} key={post.id}>
								<PostCard {...toPostCardProps(post)} />
							</View>
						))}
					</ScrollView>
				) : (
					<Text style={styles.empty}>No recommendations yet. Try updating your preferences.</Text>
				)}
				<View style={styles.section}>
					<SectionHeading
						title="Easy wins"
						subtitle="Quick recipes to keep the momentum going."
					/>
				</View>
				{easyLoading ? (
					<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
				) : easyPosts.length ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalRow}
					>
						{easyPosts.slice(0, 6).map((post) => (
							<View style={styles.horizontalCard} key={post.id}>
								<PostCard {...toPostCardProps(post)} />
							</View>
						))}
					</ScrollView>
				) : (
					<Text style={styles.empty}>No easy recipes right now.</Text>
				)}
				<View style={styles.section}>
					<SectionHeading
						title="Challenge yourself"
						subtitle="Big flavours, bigger wins."
					/>
				</View>
				{challengeLoading ? (
					<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
				) : challengePosts.length ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalRow}
					>
						{challengePosts.slice(0, 6).map((post) => (
							<View style={styles.horizontalCard} key={post.id}>
								<PostCard {...toPostCardProps(post)} />
							</View>
						))}
					</ScrollView>
				) : (
					<Text style={styles.empty}>No challenge recipes right now.</Text>
				)}
				<View style={styles.section}>
					<SectionHeading
						title="From your friends"
						subtitle="Fresh ideas from people you know."
					/>
				</View>
				{friendLoading ? (
					<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
				) : friendPosts.length ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalRow}
					>
						{friendPosts.slice(0, 6).map((post) => (
							<View style={styles.horizontalCard} key={post.id}>
								<PostCard {...toPostCardProps(post)} />
							</View>
						))}
					</ScrollView>
				) : (
					<Text style={styles.empty}>No posts from friends yet.</Text>
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
	horizontalRow: { gap: 16, paddingRight: 20, paddingBottom: 8 },
	horizontalCard: { width: 290 },
	loading: { marginTop: 24 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21 },
});
