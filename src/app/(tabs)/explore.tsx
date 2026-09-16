import { PostCard } from "@/components/cards/post-card";
import { SectionHeading } from "@/components/section-heading";
import { UserAvatar } from "@/components/user-avatar";
import { useTheme } from "@/hooks/use-theme";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["For you", "Friends", "Quick meals", "Vegetarian", "Gluten free"];

const friendPosts = [
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
	{
		username: "lenaeats",
		initials: "LE",
		meal: "Golden breakfast tacos",
		description: "Soft eggs, avocado, and a little hot sauce to start the day.",
		imageUrl: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=85",
		timeAgo: "1 hr ago",
		tag: "Breakfast",
	},
];

export default function ExploreScreen() {
	const theme = useTheme();
	const { currentUser } = useAuthContext();
	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";

	return (
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View>
						<Text style={styles.eyebrow}>THE COMMUNITY TABLE</Text>
						<Text style={styles.title}>Explore</Text>
						<Text style={styles.subtitle}>See what your friends are cooking.</Text>
					</View>
					<UserAvatar initial={firstName.charAt(0).toUpperCase()} />
				</View>

				<View style={styles.searchBar}>
					<Text style={styles.searchIcon}>⌕</Text>
					<Text style={styles.searchPlaceholder}>Search dishes, cuisines, or friends</Text>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoryList}
				>
					{categories.map((category, index) => (
						<Pressable key={category} style={[styles.category, index === 0 && styles.activeCategory]}>
							<Text style={[styles.categoryText, index === 0 && styles.activeCategoryText]}>{category}</Text>
						</Pressable>
					))}
				</ScrollView>

				<View style={styles.feedHeader}>
					<SectionHeading
						title="From your friends"
						subtitle="Fresh ideas from people you follow."
						rightContent={<Text style={styles.feedCount}>{friendPosts.length} posts</Text>}
					/>
				</View>

				<View style={styles.feed}>
					{friendPosts.map((post) => (
						<PostCard key={post.meal} {...post} />
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 36,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 14,
		paddingBottom: 22,
	},
	eyebrow: {
		color: "#D17A58",
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.4,
	},
	title: {
		color: "#203429",
		fontSize: 34,
		fontWeight: "800",
		marginTop: 5,
	},
	subtitle: {
		color: "#738078",
		fontSize: 14,
		marginTop: 4,
	},
	searchBar: {
		height: 50,
		borderRadius: 16,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E9EDE7",
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
	},
	searchIcon: {
		color: "#688A5E",
		fontSize: 27,
		lineHeight: 27,
		marginRight: 9,
	},
	searchPlaceholder: {
		color: "#98A29B",
		fontSize: 13,
	},
	categoryList: {
		gap: 9,
		paddingVertical: 20,
		paddingRight: 20,
	},
	category: {
		borderRadius: 13,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E7ECE4",
		paddingHorizontal: 14,
		paddingVertical: 9,
	},
	activeCategory: {
		backgroundColor: "#254C3A",
		borderColor: "#254C3A",
	},
	categoryText: {
		color: "#718078",
		fontSize: 12,
		fontWeight: "700",
	},
	activeCategoryText: {
		color: "#FFFFFF",
	},
	feedHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginTop: 4,
		marginBottom: 15,
	},
	feedCount: {
		color: "#688A5E",
		fontSize: 12,
		fontWeight: "800",
		paddingBottom: 2,
	},
	feed: {
		gap: 16,
	},
});
