import { ChallengeCard } from "@/components/cards/challenge-card";
import { PostCard } from "@/components/cards/post-card";
import { StreakCard } from "@/components/cards/streak-card";
import { SectionHeading } from "@/components/section-heading";
import { UserAvatar } from "@/components/user-avatar";
import { useTheme } from "@/hooks/use-theme";
import { useAuthContext } from "@/lib/auth/auth-context";
import { useMemo } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const challenges = [
	{ title: "One-pan wonder", detail: "Cook a meal in one pan", progress: 1, total: 2, color: "#D77A61" },
	{ title: "Fresh start", detail: "Add a fruit or vegetable", progress: 3, total: 3, color: "#7D9F68" },
	{ title: "Share the table", detail: "Post a dish you made", progress: 0, total: 1, color: "#D5A94D" },
];

const recentPosts = [
	{
		username: "maya.cooks",
		initials: "MC",
		meal: "Crispy chickpea bowl",
		description: "A bright, crunchy dinner with tahini lemon sauce.",
		imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85",
		timeAgo: "12 min ago",
		tag: "Vegetarian",
	},
	{
		username: "jonahbites",
		initials: "JB",
		meal: "Weeknight tomato pasta",
		description: "Simple ingredients, big comfort, and ready in 25 minutes.",
		imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85",
		timeAgo: "38 min ago",
		tag: "Quick meal",
	},
];

export default function HomeLayout() {
	const theme = useTheme();
	const { currentUser } = useAuthContext();
	const firstName = useMemo(
		() => currentUser?.username?.split(/[._-]/)[0] || "friend",
		[currentUser?.username]
	);

	return (
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View>
						<Text style={styles.eyebrow}>GOOD MORNING</Text>
						<Text style={styles.greeting}>Hey, {firstName}.</Text>
						<Text style={styles.subtitle}>A little progress tastes good.</Text>
					</View>
					<UserAvatar initial={firstName.charAt(0).toUpperCase()} tone="green" />
				</View>

				<StreakCard days={6} note="You are building a habit." />

				<View style={styles.sectionHeader}>
					<SectionHeading
						title="This week"
						subtitle="Small goals, real momentum."
						rightContent={<Pressable><Text style={styles.seeAll}>See all</Text></Pressable>}
					/>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.challengeList}>
					{challenges.map((challenge) => <ChallengeCard key={challenge.title} {...challenge} />)}
				</ScrollView>

				<View style={[styles.sectionHeader, styles.postsHeader]}>
					<SectionHeading
						title="From your circle"
						subtitle="A little inspiration from friends."
						rightContent={<Pressable><Text style={styles.seeAll}>Explore</Text></Pressable>}
					/>
				</View>

				<View style={styles.postsList}>
					{recentPosts.map((post) => <PostCard key={post.meal} {...post} />)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1 },
	scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
	header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 14, paddingBottom: 25 },
	eyebrow: { color: "#7D9F68", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
	greeting: { color: "#203429", fontSize: 32, fontWeight: "800", marginTop: 5, letterSpacing: -0.5 },
	subtitle: { color: "#738078", fontSize: 14, marginTop: 4 },
	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 30, marginBottom: 15 },
	seeAll: { color: "#688A5E", fontSize: 13, fontWeight: "800", paddingBottom: 2 },
	challengeList: { gap: 12, paddingRight: 20 },
	postsHeader: { marginTop: 32 },
	postsList: { gap: 16 },
});