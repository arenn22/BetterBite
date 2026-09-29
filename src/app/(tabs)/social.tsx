import { useEffect, useMemo, useState } from "react";
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
import {
	DEFAULT_PROFILE_IMAGE,
	fetchFriendRequests,
	fetchFriends,
	fetchUserProfile,
	respondToFriendRequest,
	searchUsers,
	sendFriendRequest,
} from "@/services/api";
import type { Profile, SearchUserResult } from "@/types/auth";

type Friend = Record<string, unknown>;
type Request = {
	id?: number;
	request_id?: number;
	friendship_id?: number;
	sender_username?: string;
	username?: string;
};

function friendName(friend: Friend) {
	return String(
		friend.username ||
			friend.display_name ||
			friend.friend_username ||
			"Friend",
	);
}

function friendId(friend: Friend, fallback: number) {
	return String(
		friend.id ??
			friend.friend_id ??
			friend.user_id ??
			friend.profile_id ??
			fallback,
	);
}

function friendImage(friend: Friend) {
	const image = friend.pfp_url || friend.avatar_url || friend.profile_image;
	return typeof image === "string" && image.trim() ? image : null;
}

function statValue(friend: Friend, ...keys: string[]) {
	for (const key of keys) {
		const value = Number(friend[key]);
		if (Number.isFinite(value)) return value;
	}
	return null;
}

function Avatar({
	friend,
	size = "medium",
}: {
	friend: Friend;
	size?: "small" | "medium" | "large";
}) {
	const name = friendName(friend);
	const dimensions =
		size === "large"
			? styles.avatarLarge
			: size === "small"
				? styles.avatarSmall
				: styles.avatarMedium;
	const image = friendImage(friend);
	return image ? (
		<Image source={{ uri: image }} style={[styles.avatar, dimensions]} />
	) : (
		<View style={[styles.avatar, dimensions, styles.avatarFallback]}>
			<Text style={styles.avatarText}>
				{name.slice(0, 2).toUpperCase()}
			</Text>
		</View>
	);
}

function TierBadge({ friend }: { friend: Friend }) {
	const tier = String(friend.tier || friend.experience_level || "").trim();
	return tier ? <Text style={styles.tierBadge}>{tier}</Text> : null;
}

function FriendProfile({
	profile,
	posts,
	loading,
	onClose,
}: {
	profile: Profile;
	posts: (typeof import("@/types/models").Post)[];
	loading: boolean;
	onClose: () => void;
}) {
	return (
		<View style={styles.profileCard}>
			<View style={styles.profileBanner}>
				<Pressable onPress={onClose} style={styles.closeButton}>
					<Text style={styles.closeText}>x</Text>
				</Pressable>
			</View>
			<View style={styles.profileBody}>
				<View style={styles.profileIdentity}>
					<Image
						source={{
							uri:
								profile.pfp_url?.trim() ||
								DEFAULT_PROFILE_IMAGE,
						}}
						style={styles.avatarLarge}
					/>
					<View>
						<Text style={styles.profileName}>
							{profile.username}
						</Text>
						<Text style={styles.memberText}>BetterBite member</Text>
					</View>
				</View>
				<View style={styles.profileStats}>
					<View style={styles.profileStat}>
						<Text style={styles.profileStatValue}>
							{loading ? "-" : posts.length}
						</Text>
						<Text style={styles.profileStatLabel}>Recipes</Text>
					</View>
					<View style={styles.profileStat}>
						<Text style={styles.profileStatValue}>
							{profile.experience_level ?? 0}
						</Text>
						<Text style={styles.profileStatLabel}>Level</Text>
					</View>
					<View style={styles.profileStat}>
						<Text style={styles.profileStatValue}>
							{profile.streakCount ?? profile.streakcount ?? 0}
						</Text>
						<Text style={styles.profileStatLabel}>Streak</Text>
					</View>
				</View>
				{loading ? (
					<ActivityIndicator
						color={AppTheme.accent}
						style={styles.loading}
					/>
				) : posts.length ? (
					<PostGrid posts={posts.slice(0, 4)} />
				) : (
					<Text style={styles.profileEmpty}>
						No published recipes yet.
					</Text>
				)}
			</View>
		</View>
	);
}

export default function SocialScreen() {
	const { currentUser } = useAuthContext();
	const [friends, setFriends] = useState<Friend[]>([]);
	const [requests, setRequests] = useState<Request[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
		null,
	);
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [responding, setResponding] = useState(false);
	const { posts: selectedPosts, loading: selectedPostsLoading } = usePostFeed(
		{
			authorId: selectedProfile?.id,
			enabled: Boolean(selectedProfile?.id),
		},
	);

	async function loadSocialData() {
		if (!currentUser) return;
		setLoading(true);
		try {
			const [friendsResult, requestsResult] = await Promise.all([
				fetchFriends(),
				fetchFriendRequests(),
			]);
			setFriends((friendsResult || []) as Friend[]);
			setRequests((requestsResult || []) as Request[]);
		} catch (error) {
			Alert.alert(
				"Could not load social activity",
				error instanceof Error
					? error.message
					: "Please try again shortly.",
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadSocialData();
	}, [currentUser]);

	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}
		let active = true;
		const timer = setTimeout(() => {
			searchUsers(searchQuery.trim())
				.then((results) => {
					if (!active) return;
					setSearchResults(
						results.filter(
							(user) =>
								user.id !== currentUser?.id &&
								!friends.some(
									(friend) =>
										friendId(friend, -1) === user.id,
								),
						),
					);
				})
				.catch(() => active && setSearchResults([]));
		}, 250);
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [currentUser, friends, searchQuery]);

	const rankedFriends = useMemo(
		() =>
			friends
				.map((friend) => ({
					friend,
					score: statValue(
						friend,
						"score",
						"points",
						"weekly_points",
					),
				}))
				.filter(
					(entry): entry is { friend: Friend; score: number } =>
						entry.score !== null,
				)
				.sort((a, b) => b.score - a.score),
		[friends],
	);

	async function addFriend(user: SearchUserResult) {
		setSending(true);
		try {
			await sendFriendRequest(user.id);
			Alert.alert(
				"Friend request sent",
				`Your request to ${user.username} is on the way.`,
			);
			setSearchQuery("");
			await loadSocialData();
		} catch (error) {
			Alert.alert(
				"Could not send request",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setSending(false);
		}
	}

	async function respond(request: Request, accept: boolean) {
		const requestId = Number(
			request.request_id ?? request.friendship_id ?? request.id ?? 0,
		);
		if (!requestId) return;
		setResponding(true);
		try {
			await respondToFriendRequest(requestId, accept);
			await loadSocialData();
		} catch (error) {
			Alert.alert(
				"Could not update request",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setResponding(false);
		}
	}

	async function openProfile(friend: Friend) {
		const profile = await fetchUserProfile(friendId(friend, -1));
		if (profile) setSelectedProfile(profile);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<TabHeader
					eyebrow="Your crew"
					title="Social"
					subtitle="Add friends, manage requests, and check in with your people."
					initial={currentUser?.username.charAt(0).toUpperCase()}
				/>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Top this week</Text>
						<Pressable
							onPress={() =>
								setShowLeaderboard((value) => !value)
							}
						>
							<Text style={styles.linkText}>
								{showLeaderboard ? "Hide" : "See leaderboard"}
							</Text>
						</Pressable>
					</View>
					<View style={styles.panel}>
						{rankedFriends.length ? (
							rankedFriends
								.slice(0, showLeaderboard ? 6 : 3)
								.map((entry, index) => (
									<View
										key={friendId(entry.friend, index)}
										style={styles.rankRow}
									>
										<Text style={styles.rankNumber}>
											{index + 1}
										</Text>
										<Avatar
											friend={entry.friend}
											size="small"
										/>
										<Text style={styles.rankName}>
											{friendName(entry.friend)}
										</Text>
										<Text style={styles.rankScore}>
											{entry.score} pts
										</Text>
									</View>
								))
						) : (
							<Text style={styles.emptyPanel}>
								Leaderboard scores will appear as social stats
								are recorded.
							</Text>
						)}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionLabel}>Add friends</Text>
					<TextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search users"
						placeholderTextColor={AppTheme.muted}
						style={styles.search}
					/>
					{searchQuery.trim() ? (
						searchResults.length ? (
							<View style={styles.panel}>
								{searchResults.map((user) => (
									<View key={user.id} style={styles.userRow}>
										<Image
											source={{
												uri:
													user.pfp_url?.trim() ||
													DEFAULT_PROFILE_IMAGE,
											}}
											style={styles.userAvatar}
										/>
										<Text style={styles.userName}>
											{user.username}
										</Text>
										<Pressable
											disabled={sending}
											onPress={() => void addFriend(user)}
											style={[
												styles.actionButton,
												sending && styles.disabled,
											]}
										>
											<Text style={styles.actionText}>
												+ Add
											</Text>
										</Pressable>
									</View>
								))}
							</View>
						) : (
							<Text style={styles.empty}>
								No matching users found.
							</Text>
						)
					) : (
						<Text style={styles.empty}>
							Start typing to find people to follow.
						</Text>
					)}
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionLabel}>Friend requests</Text>
						{requests.length ? (
							<Text style={styles.requestCount}>
								{requests.length}
							</Text>
						) : null}
					</View>
					<View style={styles.panel}>
						{loading ? (
							<ActivityIndicator
								color={AppTheme.accent}
								style={styles.loading}
							/>
						) : requests.length ? (
							requests.map((request, index) => {
								const name =
									request.sender_username ||
									request.username ||
									"Friend";
								return (
									<View
										key={String(
											request.id ??
												request.request_id ??
												index,
										)}
										style={styles.userRow}
									>
										<View style={styles.initialAvatar}>
											<Text style={styles.initialText}>
												{name.slice(0, 2).toUpperCase()}
											</Text>
										</View>
										<View style={styles.requestInfo}>
											<Text style={styles.userName}>
												{name}
											</Text>
											<Text style={styles.muted}>
												Wants to connect
											</Text>
										</View>
										<Pressable
											disabled={responding}
											onPress={() =>
												void respond(request, false)
											}
											style={styles.rejectButton}
										>
											<Text style={styles.rejectText}>
												Reject
											</Text>
										</Pressable>
										<Pressable
											disabled={responding}
											onPress={() =>
												void respond(request, true)
											}
											style={styles.actionButton}
										>
											<Text style={styles.actionText}>
												Accept
											</Text>
										</Pressable>
									</View>
								);
							})
						) : (
							<Text style={styles.emptyPanel}>
								No pending requests right now.
							</Text>
						)}
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionLabel}>Your friends</Text>
						<Text style={styles.muted}>
							{friends.length} friends
						</Text>
					</View>
					{loading ? (
						<ActivityIndicator color={AppTheme.accent} />
					) : friends.length ? (
						<View style={styles.panel}>
							{friends.map((friend, index) => (
								<Pressable
									key={friendId(friend, index)}
									onPress={() => void openProfile(friend)}
									style={styles.friendRow}
								>
									<Avatar friend={friend} />
									<View style={styles.friendInfo}>
										<View style={styles.friendNameRow}>
											<Text style={styles.userName}>
												{friendName(friend)}
											</Text>
											<TierBadge friend={friend} />
										</View>
										<Text style={styles.muted}>
											{statValue(
												friend,
												"streak",
												"streakCount",
												"streakcount",
											) ?? "No"}{" "}
											day streak
										</Text>
									</View>
									<Text style={styles.viewText}>View</Text>
								</Pressable>
							))}
						</View>
					) : (
						<Text style={styles.empty}>
							You haven&apos;t connected with anyone yet.
						</Text>
					)}
				</View>

				{selectedProfile ? (
					<FriendProfile
						profile={selectedProfile}
						posts={selectedPosts}
						loading={selectedPostsLoading}
						onClose={() => setSelectedProfile(null)}
					/>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F7F7F4" },
	content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44 },
	section: { marginBottom: 26 },
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	sectionTitle: { color: AppTheme.text, fontSize: 15, fontWeight: "800" },
	sectionLabel: {
		color: AppTheme.accent,
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	linkText: { color: AppTheme.accent, fontSize: 11, fontWeight: "700" },
	panel: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 16,
		overflow: "hidden",
	},
	rankRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 14,
		paddingVertical: 11,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F2",
	},
	rankNumber: {
		color: AppTheme.muted,
		width: 18,
		textAlign: "center",
		fontSize: 12,
		fontWeight: "800",
	},
	rankName: {
		color: AppTheme.text,
		flex: 1,
		fontSize: 13,
		fontWeight: "700",
	},
	rankScore: { color: AppTheme.muted, fontSize: 11, fontWeight: "700" },
	search: {
		height: 48,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: AppTheme.border,
		backgroundColor: "#FFFFFF",
		color: AppTheme.text,
		paddingHorizontal: 15,
		fontSize: 14,
		marginBottom: 10,
	},
	userRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 11,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F2",
	},
	userAvatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: AppTheme.warmSoft,
	},
	initialAvatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	initialText: { color: AppTheme.accent, fontSize: 11, fontWeight: "800" },
	userName: {
		color: AppTheme.text,
		fontSize: 13,
		fontWeight: "700",
		flex: 1,
	},
	actionButton: {
		backgroundColor: AppTheme.accent,
		borderRadius: 16,
		paddingHorizontal: 11,
		paddingVertical: 7,
	},
	actionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
	rejectButton: {
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 16,
		paddingHorizontal: 9,
		paddingVertical: 6,
	},
	rejectText: { color: AppTheme.warm, fontSize: 10, fontWeight: "700" },
	requestInfo: { flex: 1 },
	requestCount: {
		color: "#FFFFFF",
		backgroundColor: AppTheme.warm,
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 2,
		fontSize: 10,
		fontWeight: "800",
	},
	friendRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 11,
		paddingHorizontal: 13,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F2",
	},
	friendInfo: { flex: 1 },
	friendNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
	viewText: { color: AppTheme.accent, fontSize: 11, fontWeight: "700" },
	tierBadge: {
		color: AppTheme.accent,
		backgroundColor: AppTheme.accentSoft,
		borderRadius: 10,
		paddingHorizontal: 7,
		paddingVertical: 3,
		fontSize: 9,
		fontWeight: "800",
	},
	muted: { color: AppTheme.muted, fontSize: 10, marginTop: 3 },
	empty: {
		color: AppTheme.muted,
		fontSize: 13,
		lineHeight: 20,
		marginTop: 9,
	},
	emptyPanel: {
		color: AppTheme.muted,
		fontSize: 12,
		lineHeight: 18,
		textAlign: "center",
		paddingHorizontal: 16,
		paddingVertical: 18,
	},
	disabled: { opacity: 0.55 },
	loading: { paddingVertical: 16 },
	avatar: { backgroundColor: AppTheme.warmSoft },
	avatarSmall: { width: 32, height: 32, borderRadius: 16 },
	avatarMedium: { width: 44, height: 44, borderRadius: 22 },
	avatarLarge: { width: 58, height: 58, borderRadius: 29 },
	avatarFallback: {
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { color: AppTheme.accent, fontSize: 11, fontWeight: "800" },
	profileCard: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 18,
		overflow: "hidden",
		marginBottom: 20,
	},
	profileBanner: { height: 58, backgroundColor: AppTheme.warmSoft },
	closeButton: {
		position: "absolute",
		right: 10,
		top: 10,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},
	closeText: { color: AppTheme.muted, fontSize: 14 },
	profileBody: { padding: 15, marginTop: -30 },
	profileIdentity: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		marginBottom: 14,
	},
	profileName: { color: AppTheme.text, fontSize: 17, fontWeight: "800" },
	memberText: { color: AppTheme.muted, fontSize: 10, marginTop: 3 },
	profileStats: { flexDirection: "row", gap: 7, marginBottom: 16 },
	profileStat: {
		flex: 1,
		alignItems: "center",
		backgroundColor: "#F7F7F4",
		borderRadius: 11,
		paddingVertical: 9,
	},
	profileStatValue: { color: AppTheme.text, fontSize: 15, fontWeight: "800" },
	profileStatLabel: {
		color: AppTheme.muted,
		fontSize: 9,
		marginTop: 3,
		textTransform: "uppercase",
	},
	profileEmpty: {
		color: AppTheme.muted,
		fontSize: 12,
		textAlign: "center",
		paddingVertical: 16,
	},
});
