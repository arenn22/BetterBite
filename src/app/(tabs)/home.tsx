import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { AppTheme } from "@/constants/app-theme";
import { resolvePostImageUrl } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
	fetchUserProfile,
	get_challenge_posts,
	get_easy_posts,
	get_friend_posts,
	get_recommended_posts,
} from "@/services/api";
import type { Post } from "@/types/models";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const LOGGED_DAYS = [true, true, true, true, true, false, false];

function getDifficultyText(level: number | string | undefined) {
	const normalized = Number(level ?? 1);
	if (normalized >= 5) return "Advanced";
	if (normalized === 4) return "Hard";
	if (normalized === 3) return "Medium";
	if (normalized === 2) return "Easy";
	return "Beginner";
}

function getDifficultyStyle(level: number | string | undefined) {
	const value = getDifficultyText(level);
	switch (value) {
		case "Beginner":
			return { backgroundColor: "#E8EDE5", color: "#687B5D" };
		case "Easy":
			return { backgroundColor: "#E8EDE5", color: "#687B5D" };
		case "Medium":
			return { backgroundColor: "#FDF0EA", color: "#C4855F" };
		case "Hard":
			return { backgroundColor: "#FDEAE0", color: "#C4855F" };
		case "Advanced":
			return { backgroundColor: "#FCE4D6", color: "#B5603A" };
		default:
			return { backgroundColor: "#E8EDE5", color: "#687B5D" };
	}
}

function getRecipeTime(recipe: Record<string, unknown> | undefined): string {
	if (!recipe || typeof recipe !== "object") return "20 min";
	const candidates = [
		recipe.time,
		recipe.total_time,
		recipe.cook_time,
		recipe.prep_time,
		recipe.minutes,
		recipe.duration,
	];
	for (const candidate of candidates) {
		if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
			return `${Math.max(1, Math.round(candidate))} min`;
		}
		if (typeof candidate === "string" && candidate.trim()) {
			return candidate.trim();
		}
	}
	return "20 min";
}

function getFriendName(post: Post) {
	const raw = post.author_username || "Friend";
	const parts = raw.split(/[\s._-]+/).filter(Boolean);
	if (parts.length < 2) {
		return raw.length > 11 ? `${raw.slice(0, 11)}…` : raw;
	}
	return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

function RecipeCard({ recipe, showFriend = false }: { recipe: Post; showFriend?: boolean }) {
	const [liked, setLiked] = useState(false);
	const [imageError, setImageError] = useState(false);
	const difficultyStyle = getDifficultyStyle(recipe.difficulty);
	const friendName = getFriendName(recipe);
	const recipeTime = getRecipeTime(recipe.recipe as Record<string, unknown> | undefined);
	const imageUri = recipe.image_url && !imageError ? recipe.image_url : undefined;

	return (
		<Pressable style={styles.recipeCard}>
			<View style={styles.recipeImageWrap}>
				{imageUri ? (
					<Image
						source={{ uri: imageUri }}
						style={styles.recipeImage}
						onError={() => setImageError(true)}
					/>
				) : (
					<View style={styles.recipePlaceholder} />
				)}
				<Pressable
					style={({ pressed }) => [styles.likeButton, pressed && styles.likeButtonPressed]}
					onPress={() => setLiked((current) => !current)}
				>
					<Text style={styles.likeText}>{liked ? "❤️" : "🤍"}</Text>
				</Pressable>
				{showFriend ? (
					<View style={styles.friendBadge}>
						<Text style={styles.friendBadgeText}>{friendName}</Text>
					</View>
				) : null}
			</View>
			<View style={styles.recipeInfo}>
				<Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title || "Untitled recipe"}</Text>
				<View style={styles.recipeMetaRow}>
					<View style={[styles.difficultyPill, { backgroundColor: difficultyStyle.backgroundColor }]}> 
						<Text style={[styles.difficultyText, { color: difficultyStyle.color }]}>{getDifficultyText(recipe.difficulty)}</Text>
					</View>
					<Text style={styles.recipeTime}>{recipeTime}</Text>
				</View>
			</View>
		</Pressable>
	);
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
	return (
		<View style={styles.sectionHeader}>
			<Text style={styles.sectionIcon}>{icon}</Text>
			<View style={styles.sectionHeaderTextContainer}>
				<Text style={styles.sectionTitle}>{title}</Text>
				<Text style={styles.sectionSubtitle}>{subtitle}</Text>
			</View>
		</View>
	);
}

function HomeRecipeSection({
	icon,
	title,
	subtitle,
	recipes,
	showFriend = false,
}: {
	icon: string;
	title: string;
	subtitle: string;
	recipes: Post[];
	showFriend?: boolean;
}) {
	return (
		<View style={styles.sectionWrap}>
			<SectionHeader icon={icon} title={title} subtitle={subtitle} />
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.horizontalRow}
			>
				{recipes.map((recipe) => (
					<View key={recipe.id} style={styles.horizontalCard}>
						<RecipeCard recipe={recipe} showFriend={showFriend} />
					</View>
				))}
			</ScrollView>
		</View>
	);
}

export default function HomeScreen() {
	const router = useRouter();
	const { currentUser } = useAuthContext();
	const [loggedToday, setLoggedToday] = useState(false);
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
		if (!currentUser?.id) return;
		const userId = currentUser.id;
		let active = true;
		async function loadProfile() {
			try {
				const profile = await fetchUserProfile(userId);
				if (!active || !profile) return;
				setStreak(Number(profile.streakCount ?? profile.streakcount ?? 0));
			} catch {
				if (active) setStreak(0);
			}
		}
		void loadProfile();
		return () => { active = false; };
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
				if (active) setRecommendedPosts([]);
			} finally {
				if (active) setRecommendedLoading(false);
			}
		}
		void loadRecommended();
		return () => { active = false; };
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
				if (active) setPosts([]);
			} finally {
				if (active) setLoading(false);
			}
		}

		void Promise.all([
			loadSection(get_easy_posts, setEasyPosts, setEasyLoading),
			loadSection(get_challenge_posts, setChallengePosts, setChallengeLoading),
			loadSection(get_friend_posts, setFriendPosts, setFriendLoading),
		]);

		return () => { active = false; };
	}, []);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.headerRow}>
					<View style={styles.headerTextWrap}>
						<Text style={styles.headerEyebrow}>Good morning</Text>
						<Text style={styles.headerTitle}>Hey, {firstName}.</Text>
						<Text style={styles.headerSubtitle}>A little progress tastes good.</Text>
					</View>
					<View style={styles.headerRight}>
						<View style={styles.avatarWrap}>
							<Image
								source={{
									uri: "https://images.unsplash.com/photo-1556910636-c508da52e01c?w=96&h=96&fit=crop&auto=format",
								}}
								style={styles.avatarImage}
							/>
							<View style={styles.avatarBadge}>
								<Text style={styles.avatarBadgeText}>Home Cook</Text>
							</View>
						</View>
						<Pressable
							onPress={() => router.push("/settings")}
							style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
						>
							<Text style={styles.settingsIcon}>⚙</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.streakCard}>
					<View style={styles.streakHeaderRow}>
						<View>
							<View style={styles.streakTitleRow}>
								<Text style={styles.fireIcon}>🔥</Text>
								<Text style={styles.streakTitle}>{Math.max(streak, 5)} day streak</Text>
							</View>
							<Text style={styles.streakNote}>Keep your cooking rhythm going.</Text>
						</View>
						<Pressable
							onPress={() => setLoggedToday((current) => !current)}
							style={({ pressed }) => [
								styles.logButton,
								loggedToday && styles.logButtonLogged,
								pressed && styles.logButtonPressed,
							]}
						>
							<Text style={[styles.logButtonText, loggedToday && styles.logButtonTextLogged]}>
								{loggedToday ? "Logged ✓" : "Log today"}
							</Text>
						</Pressable>
					</View>
					<View style={styles.weekRow}>
						{DAYS.map((day, index) => {
							const isActive = LOGGED_DAYS[index] || (index === 5 && loggedToday);
							return (
								<View key={`${day}-${index}`} style={styles.dayColumn}>
									<View style={[styles.dayDot, isActive ? styles.dayDotActive : styles.dayDotInactive]}>
										{isActive ? <Text style={styles.dayDotText}>🔥</Text> : <Text style={styles.dayLetter}>{day}</Text>}
									</View>
									<Text style={styles.dayLabel}>{day}</Text>
								</View>
							);
						})}
					</View>
				</View>

				<View style={styles.challengeBanner}>
					<View style={styles.challengeGlowOne} />
					<View style={styles.challengeGlowTwo} />
					<View style={styles.challengeContent}>
						<View style={styles.challengeHeadingRow}>
							<Text style={styles.challengeEyebrow}>This week's challenge</Text>
							<Text style={styles.challengeIcon}>🏆</Text>
						</View>
						<Text style={styles.challengeTitle}>One-Pan Dinners</Text>
						<Text style={styles.challengeSubtitle}>Cook any meal using just one pan, pot, or skillet. Simple wins.</Text>
						<View style={styles.challengeFooterRow}>
							<View style={styles.friendStack}>
								{["🧑", "👩", "🧑‍🍳"].map((emoji, index) => (
									<View key={`${emoji}-${index}`} style={styles.friendStackItem}>
										<Text>{emoji}</Text>
									</View>
								))}
								<Text style={styles.challengeMeta}>3 friends completed this</Text>
							</View>
							<Pressable style={styles.challengeButton}>
								<Text style={styles.challengeButtonText}>Join →</Text>
							</Pressable>
						</View>
					</View>
				</View>

				{recommendedLoading ? (
					<View style={styles.loadingWrap}><ActivityIndicator color={AppTheme.accent} /></View>
				) : (
					<HomeRecipeSection
						icon="🔥"
						title="Recommended for you"
						subtitle="Hand-picked matches for your level"
						recipes={recommendedPosts.slice(0, 6)}
					/>
				)}

				{easyLoading ? (
					<View style={styles.loadingWrap}><ActivityIndicator color={AppTheme.accent} /></View>
				) : (
					<HomeRecipeSection
						icon="⚡"
						title="Easy wins"
						subtitle="Under 20 minutes, no fuss"
						recipes={easyPosts.slice(0, 6)}
					/>
				)}

				{challengeLoading ? (
					<View style={styles.loadingWrap}><ActivityIndicator color={AppTheme.accent} /></View>
				) : (
					<HomeRecipeSection
						icon="🏆"
						title="Challenge yourself"
						subtitle="Push your skills further"
						recipes={challengePosts.slice(0, 6)}
					/>
				)}

				{friendLoading ? (
					<View style={styles.loadingWrap}><ActivityIndicator color={AppTheme.accent} /></View>
				) : (
					<HomeRecipeSection
						icon="👥"
						title="From your friends"
						subtitle="What the community cooked this week"
						recipes={friendPosts.slice(0, 6)}
						showFriend
					/>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F7F7F4" },
	content: {
		paddingHorizontal: 16,
		paddingBottom: 40,
		maxWidth: 430,
		width: "100%",
		alignSelf: "center",
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingTop: 28,
		paddingBottom: 18,
	},
	headerTextWrap: { flex: 1, paddingRight: 12 },
	headerEyebrow: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.5,
		color: "#687B5D",
		textTransform: "uppercase",
		marginBottom: 4,
	},
	headerTitle: {
		fontSize: 34,
		fontWeight: "700",
		color: "#2A2A25",
		lineHeight: 38,
	},
	headerSubtitle: {
		marginTop: 4,
		fontSize: 14,
		fontWeight: "500",
		color: "#7A7A72",
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	avatarWrap: {
		position: "relative",
	},
	avatarImage: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 2,
		borderColor: "#687B5D",
	},
	avatarBadge: {
		position: "absolute",
		bottom: -6,
		right: -8,
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: 999,
		backgroundColor: "#687B5D",
	},
	avatarBadgeText: {
		fontSize: 8,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	settingsButton: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		alignItems: "center",
		justifyContent: "center",
	},
	settingsButtonPressed: { opacity: 0.9 },
	settingsIcon: { fontSize: 17, color: "#7A7A72" },
	sectionWrap: { marginTop: 18, marginBottom: 10 },
	sectionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12, paddingHorizontal: 4 },
	sectionHeaderTextContainer: { flex: 1 },
	sectionIcon: { fontSize: 20, marginTop: 2 },
	sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2A2A25" },
	sectionSubtitle: { fontSize: 12, color: "#7A7A72", marginTop: 2, fontWeight: "500" },
	horizontalRow: { paddingRight: 8, paddingBottom: 4 },
	horizontalCard: { width: 176, marginRight: 12 },
	recipeCard: {
		width: 176,
		borderRadius: 18,
		overflow: "hidden",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	recipeImageWrap: {
		position: "relative",
		height: 120,
		backgroundColor: "#E8EDE5",
	},
	recipeImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	recipePlaceholder: {
		width: "100%",
		height: "100%",
		backgroundColor: "#E8EDE5",
	},
	likeButton: {
		position: "absolute",
		top: 8,
		right: 8,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "rgba(255,255,255,0.8)",
		alignItems: "center",
		justifyContent: "center",
	},
	likeButtonPressed: { opacity: 0.8 },
	likeText: { fontSize: 14 },
	friendBadge: {
		position: "absolute",
		bottom: 8,
		left: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
		backgroundColor: "rgba(255,255,255,0.9)",
	},
	friendBadgeText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#2A2A25",
	},
	recipeInfo: { padding: 10 },
	recipeTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: "#2A2A25",
		lineHeight: 16,
		marginBottom: 8,
	},
	recipeMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
	difficultyPill: {
		paddingHorizontal: 7,
		paddingVertical: 4,
		borderRadius: 999,
	},
	difficultyText: {
		fontSize: 9,
		fontWeight: "700",
	},
	recipeTime: {
		fontSize: 10,
		color: "#7A7A72",
		fontWeight: "600",
	},
	streakCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E5E5E0",
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 14,
		marginBottom: 18,
		shadowColor: "#000",
		shadowOpacity: 0.04,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	streakHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
	streakTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	fireIcon: { fontSize: 18 },
	streakTitle: { fontSize: 25, fontWeight: "700", color: "#2A2A25" },
	streakNote: { marginTop: 4, fontSize: 12, color: "#7A7A72" },
	logButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#687B5D",
	},
	logButtonLogged: { backgroundColor: "#E8EDE5" },
	logButtonPressed: { opacity: 0.9 },
	logButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
	logButtonTextLogged: { color: "#687B5D" },
	weekRow: { flexDirection: "row", justifyContent: "space-between" },
	dayColumn: { alignItems: "center", gap: 6 },
	dayDot: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	dayDotActive: { backgroundColor: "#D9A28B" },
	dayDotInactive: { backgroundColor: "#F0F0EC" },
	dayDotText: { fontSize: 12 },
	dayLetter: { fontSize: 11, fontWeight: "700", color: "#C0C0B8" },
	dayLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, color: "#ADADAA" },
	challengeBanner: {
		position: "relative",
		overflow: "hidden",
		backgroundColor: "#D9A28B",
		borderRadius: 24,
		marginBottom: 18,
		padding: 16,
	},
	challengeGlowOne: {
		position: "absolute",
		top: -26,
		right: -28,
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(196, 133, 95, 0.3)",
	},
	challengeGlowTwo: {
		position: "absolute",
		bottom: -16,
		left: -16,
		width: 90,
		height: 90,
		borderRadius: 45,
		backgroundColor: "rgba(232, 196, 174, 0.4)",
	},
	challengeContent: { position: "relative", zIndex: 1 },
	challengeHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	challengeEyebrow: {
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.4,
		color: "rgba(122,58,24,0.7)",
		textTransform: "uppercase",
	},
	challengeIcon: { fontSize: 20 },
	challengeTitle: {
		marginTop: 8,
		fontSize: 25,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	challengeSubtitle: {
		marginTop: 8,
		fontSize: 12,
		color: "rgba(255,255,255,0.9)",
		lineHeight: 18,
	},
	challengeFooterRow: {
		marginTop: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	friendStack: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 },
	friendStackItem: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.5)",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: -4,
	},
	challengeMeta: {
		marginLeft: 8,
		fontSize: 11,
		color: "rgba(255,255,255,0.95)",
		fontWeight: "700",
	},
	challengeButton: {
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	challengeButtonText: { color: "#C4855F", fontSize: 11, fontWeight: "800" },
	loadingWrap: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
});
