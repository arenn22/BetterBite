import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostGrid } from "@/components/cards/post-grid";
import { TabHeader } from "@/components/tab-header";
import { AppTheme } from "@/constants/app-theme";
import { usePostFeed } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase";
import {
	DEFAULT_PROFILE_IMAGE,
	fetchFriends,
	fetchUserProfile,
} from "@/services/api";
import type { Post } from "@/types/models";

type TabId = "created" | "cooked" | "liked";
type Friend = Record<string, unknown>;

const TABS: { id: TabId; label: string }[] = [
	{ id: "created", label: "Created" },
	{ id: "cooked", label: "Cooked" },
	{ id: "liked", label: "Liked" },
];

function BotanicalBanner() {
	return (
		<View style={styles.bannerArt}>
			<View style={[styles.wash, styles.washOne]} />
			<View style={[styles.wash, styles.washTwo]} />
			<View style={[styles.leaf, styles.leafOne]} />
			<View style={[styles.leaf, styles.leafTwo]} />
			<View style={[styles.leaf, styles.leafThree]} />
			<View style={styles.bannerStem} />
			<View style={[styles.berry, styles.berryOne]} />
			<View style={[styles.berry, styles.berryTwo]} />
		</View>
	);
}

function EmptyTabState({ tab }: { tab: TabId }) {
	const copy: Record<TabId, { mark: string; heading: string; sub: string }> =
		{
			liked: {
				mark: "♡",
				heading: "No liked recipes yet",
				sub: "Liked recipes will appear here when you save them.",
			},
			cooked: {
				mark: "○",
				heading: "Nothing logged yet",
				sub: "Recipes you log as cooked will appear here.",
			},
			created: {
				mark: "+",
				heading: "No recipes created yet",
				sub: "Your published recipes will appear here.",
			},
		};
	const state = copy[tab];
	return (
		<View style={styles.emptyTab}>
			<View style={styles.emptyMark}>
				<Text style={styles.emptyMarkText}>{state.mark}</Text>
			</View>
			<Text style={styles.emptyHeading}>{state.heading}</Text>
			<Text style={styles.emptySub}>{state.sub}</Text>
		</View>
	);
}

function friendName(friend: Friend) {
	return String(
		friend.username ||
			friend.display_name ||
			friend.friend_username ||
			"Friend",
	);
}

function friendImage(friend: Friend) {
	const value = friend.pfp_url || friend.avatar_url || friend.profile_image;
	return typeof value === "string" && value.trim() ? value : null;
}

export default function ProfileScreen() {
	const { currentUser, refreshCurrentUser } = useAuthContext();
	const { posts, loading: loadingPosts } = usePostFeed({
		authorId: currentUser?.id,
		enabled: Boolean(currentUser),
	});
	const [profile, setProfile] = useState(currentUser);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [activeTab, setActiveTab] = useState<TabId>("created");
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [draftUsername, setDraftUsername] = useState(
		currentUser?.username ?? "",
	);

	useEffect(() => {
		if (!currentUser) return;
		setDraftUsername(currentUser.username);
		let active = true;
		Promise.allSettled([
			fetchUserProfile(currentUser.id),
			fetchFriends(),
		]).then(([profileResult, friendsResult]) => {
			if (!active) return;
			if (profileResult.status === "fulfilled" && profileResult.value) {
				setProfile(profileResult.value);
				setDraftUsername(profileResult.value.username);
			}
			if (friendsResult.status === "fulfilled")
				setFriends(friendsResult.value as Friend[]);
		});
		return () => {
			active = false;
		};
	}, [currentUser]);

	if (!currentUser) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<Text style={styles.empty}>Sign in to view your profile.</Text>
			</SafeAreaView>
		);
	}

	const publicProfile = profile || currentUser;
	const streak = Number(
		publicProfile.streakCount ?? publicProfile.streakcount ?? 0,
	);
	const tabPosts: Record<TabId, Post[]> = {
		created: posts,
		cooked: [],
		liked: [],
	};
	const selectedPosts = tabPosts[activeTab];

	async function saveProfile() {
		const username = draftUsername.trim();
		if (!username || username === publicProfile.username) {
			setDraftUsername(publicProfile.username);
			setEditing(false);
			return;
		}
		setSaving(true);
		const { error } = await supabase
			.from("profiles")
			.update({ username })
			.eq("id", currentUser.id);
		setSaving(false);
		if (error) {
			Alert.alert("Could not update profile", error.message);
			return;
		}
		await refreshCurrentUser();
		setProfile((current) => (current ? { ...current, username } : current));
		setEditing(false);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.headerRow}>
					<TabHeader
						eyebrow="Your account"
						title="Profile"
						subtitle="Your food, friends, and progress."
					/>
					<Pressable
						style={[
							styles.editButton,
							editing && styles.editButtonActive,
						]}
						onPress={editing ? saveProfile : () => setEditing(true)}
						disabled={saving}
					>
						{saving ? (
							<ActivityIndicator color="#FFFFFF" size="small" />
						) : (
							<Text
								style={[
									styles.editText,
									editing && styles.editTextActive,
								]}
							>
								{editing ? "Save" : "Edit"}
							</Text>
						)}
					</Pressable>
				</View>

				<View style={styles.profileCard}>
					<View style={styles.banner}>
						<BotanicalBanner />
					</View>
					<View style={styles.profileBody}>
						<View style={styles.profileTopRow}>
							<Image
								source={{
									uri:
										publicProfile.pfp_url?.trim() ||
										DEFAULT_PROFILE_IMAGE,
								}}
								style={styles.avatar}
							/>
							<View style={styles.profileTopActions}>
								<Text style={styles.actionIcon}>...</Text>
							</View>
						</View>
						{editing ? (
							<TextInput
								value={draftUsername}
								onChangeText={setDraftUsername}
								style={styles.nameInput}
								autoCapitalize="none"
							/>
						) : (
							<Text style={styles.displayName}>
								{publicProfile.username}
							</Text>
						)}
						<Text style={styles.handle}>
							@{publicProfile.username}
						</Text>
						<View style={styles.tierRow}>
							<Text style={styles.tierBadge}>Home Cook</Text>
							<Text style={styles.nextTier}>to Sous Chef</Text>
						</View>
						<View style={styles.progressBlock}>
							<View style={styles.progressLabels}>
								<Text style={styles.progressLabel}>
									Progress to Sous Chef
								</Text>
								<Text style={styles.progressValue}>
									{posts.length
										? `${Math.min(100, Math.round((posts.length / 10) * 100))}%`
										: "0%"}
								</Text>
							</View>
							<View style={styles.progressTrack}>
								<View
									style={[
										styles.progressFill,
										{
											width: `${Math.min(100, posts.length * 10)}%`,
										},
									]}
								/>
							</View>
						</View>
						<View style={styles.stats}>
							<View style={styles.stat}>
								<Text style={styles.statValue}>
									{posts.length}
								</Text>
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
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeading}>
						<Text style={styles.eyebrow}>Your friends</Text>
						<Text style={styles.seeAll}>See all</Text>
					</View>
					{friends.length ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.friendList}
						>
							{friends.map((friend, index) => {
								const name = friendName(friend);
								const image = friendImage(friend);
								return (
									<View
										key={String(
											friend.id ||
												friend.friend_id ||
												index,
										)}
										style={styles.friend}
									>
										{image ? (
											<Image
												source={{ uri: image }}
												style={styles.friendAvatar}
											/>
										) : (
											<View
												style={[
													styles.friendAvatar,
													styles.friendAvatarFallback,
												]}
											>
												<Text
													style={styles.friendInitial}
												>
													{name
														.slice(0, 2)
														.toUpperCase()}
												</Text>
											</View>
										)}
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
							Connect with friends to see them here.
						</Text>
					)}
				</View>

				<View style={styles.section}>
					<Text style={styles.eyebrow}>Your recipe library</Text>
					<View style={styles.tabs}>
						{TABS.map((tab) => {
							const active = activeTab === tab.id;
							return (
								<Pressable
									key={tab.id}
									onPress={() => setActiveTab(tab.id)}
									style={styles.tab}
								>
									<Text
										style={[
											styles.tabText,
											active && styles.activeTabText,
										]}
									>
										{tab.label}
										{tab.id === "created" && posts.length
											? `  ${posts.length}`
											: ""}
									</Text>
									{active ? (
										<View style={styles.tabIndicator} />
									) : null}
								</Pressable>
							);
						})}
					</View>
					{activeTab === "created" && loadingPosts ? (
						<ActivityIndicator
							color={AppTheme.accent}
							style={styles.loading}
						/>
					) : selectedPosts.length ? (
						<PostGrid posts={selectedPosts} />
					) : (
						<EmptyTabState tab={activeTab} />
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F7F7F4" },
	content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44 },
	headerRow: { position: "relative" },
	editButton: {
		position: "absolute",
		right: 0,
		top: 18,
		borderWidth: 1,
		borderColor: "#E5E5E0",
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 7,
	},
	editButtonActive: {
		backgroundColor: AppTheme.accent,
		borderColor: AppTheme.accent,
	},
	editText: { color: AppTheme.muted, fontSize: 12, fontWeight: "700" },
	editTextActive: { color: "#FFFFFF" },
	profileCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E5E5E0",
		overflow: "hidden",
		marginBottom: 26,
	},
	banner: { height: 120 },
	bannerArt: { flex: 1, backgroundColor: "#F0E8DF", overflow: "hidden" },
	wash: {
		position: "absolute",
		borderRadius: 100,
		backgroundColor: AppTheme.warm,
		opacity: 0.22,
	},
	washOne: { width: 150, height: 90, left: -30, top: -25 },
	washTwo: {
		width: 180,
		height: 100,
		right: -45,
		bottom: -35,
		backgroundColor: AppTheme.warm,
	},
	leaf: {
		position: "absolute",
		width: 30,
		height: 10,
		borderRadius: 20,
		backgroundColor: AppTheme.accent,
		opacity: 0.5,
	},
	leafOne: { left: 18, top: 22, transform: [{ rotate: "-25deg" }] },
	leafTwo: {
		right: 20,
		top: 18,
		transform: [{ rotate: "20deg" }],
		backgroundColor: "#8A9E7A",
	},
	leafThree: { right: 70, bottom: 24, transform: [{ rotate: "-35deg" }] },
	bannerStem: {
		position: "absolute",
		width: 2,
		height: 44,
		backgroundColor: AppTheme.accent,
		opacity: 0.5,
		left: "50%",
		top: 7,
		transform: [{ rotate: "8deg" }],
	},
	berry: {
		position: "absolute",
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: AppTheme.warm,
	},
	berryOne: { left: 76, top: 63 },
	berryTwo: { left: 88, top: 58, backgroundColor: "#C4855F" },
	profileBody: { paddingHorizontal: 16, paddingBottom: 18, marginTop: -30 },
	profileTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginBottom: 10,
	},
	avatar: {
		width: 68,
		height: 68,
		borderRadius: 34,
		borderWidth: 3,
		borderColor: AppTheme.warm,
		backgroundColor: AppTheme.warmSoft,
	},
	profileTopActions: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E5E5E0",
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},
	actionIcon: { color: AppTheme.muted, fontSize: 14, letterSpacing: 1 },
	displayName: { color: AppTheme.text, fontSize: 21, fontWeight: "700" },
	nameInput: {
		color: AppTheme.text,
		fontSize: 20,
		fontWeight: "700",
		backgroundColor: "#F7F7F4",
		borderWidth: 1,
		borderColor: AppTheme.warm,
		borderRadius: 9,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	handle: { color: "#ADADAA", fontSize: 11, marginTop: 3 },
	tierRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 13,
	},
	tierBadge: {
		color: AppTheme.accent,
		backgroundColor: AppTheme.accentSoft,
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 5,
		fontSize: 11,
		fontWeight: "800",
	},
	nextTier: { color: AppTheme.muted, fontSize: 10 },
	progressBlock: { marginTop: 15 },
	progressLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
	},
	progressLabel: {
		color: AppTheme.muted,
		fontSize: 9,
		textTransform: "uppercase",
		letterSpacing: 0.7,
	},
	progressValue: { color: AppTheme.accent, fontSize: 9, fontWeight: "800" },
	progressTrack: {
		height: 6,
		borderRadius: 4,
		backgroundColor: "#F0F0EC",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 4,
		backgroundColor: AppTheme.accent,
	},
	stats: {
		flexDirection: "row",
		borderTopWidth: 1,
		borderTopColor: "#F0F0EC",
		marginTop: 16,
		paddingTop: 14,
	},
	stat: {
		flex: 1,
		alignItems: "center",
		borderLeftWidth: 1,
		borderLeftColor: "#F0F0EC",
	},
	statValue: { color: AppTheme.accent, fontSize: 20, fontWeight: "800" },
	statLabel: {
		color: AppTheme.muted,
		fontSize: 10,
		marginTop: 3,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	section: { marginBottom: 27 },
	sectionHeading: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	eyebrow: {
		color: AppTheme.accent,
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		marginBottom: 12,
	},
	seeAll: { color: AppTheme.muted, fontSize: 10, fontWeight: "700" },
	friendList: { gap: 17, paddingVertical: 2 },
	friend: { width: 54, alignItems: "center" },
	friendAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: AppTheme.warmSoft,
	},
	friendAvatarFallback: {
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	friendInitial: { color: AppTheme.accent, fontSize: 11, fontWeight: "800" },
	friendName: {
		color: AppTheme.muted,
		fontSize: 9,
		fontWeight: "600",
		marginTop: 6,
		maxWidth: 54,
		textAlign: "center",
	},
	tabs: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E0",
		marginBottom: 16,
	},
	tab: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 10,
		position: "relative",
	},
	tabText: { color: "#ADADAA", fontSize: 12, fontWeight: "700" },
	activeTabText: { color: AppTheme.text },
	tabIndicator: {
		position: "absolute",
		bottom: -1,
		left: 16,
		right: 16,
		height: 2,
		borderRadius: 2,
		backgroundColor: AppTheme.accent,
	},
	loading: { marginTop: 20 },
	emptyTab: {
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 28,
	},
	emptyMark: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: AppTheme.warmSoft,
		borderWidth: 1,
		borderColor: AppTheme.warm,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	emptyMarkText: { color: AppTheme.warm, fontSize: 28 },
	emptyHeading: {
		color: AppTheme.text,
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 4,
	},
	emptySub: {
		color: AppTheme.muted,
		fontSize: 12,
		lineHeight: 18,
		textAlign: "center",
	},
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21 },
});
