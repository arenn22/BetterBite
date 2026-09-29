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

import { SectionHeading } from "@/components/section-heading";
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
import { useEffect, useMemo, useState } from "react";

type FriendRow = Record<string, unknown>;

type FriendRequestRow = {
	id?: number;
	request_id?: number;
	friendship_id?: number;
	sender_id?: string;
	receiver_id?: string;
	sender_username?: string;
	username?: string;
	status?: string;
};

export default function SocialScreen() {
	const { currentUser } = useAuthContext();
	const [friends, setFriends] = useState<FriendRow[]>([]);
	const [friendRequests, setFriendRequests] = useState<FriendRequestRow[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [responding, setResponding] = useState(false);
	const { posts: selectedProfilePosts, loading: selectedProfileLoading } = usePostFeed({
		authorId: selectedProfile?.id,
		enabled: Boolean(selectedProfile?.id),
	});

	const firstName = currentUser?.username?.split(/[._-]/)[0] || "friend";

	async function loadSocialData() {
		if (!currentUser) return;
		setLoading(true);
		try {
			const [friendsResult, requestsResult] = await Promise.allSettled([
				fetchFriends(),
				fetchFriendRequests(),
			]);

			if (friendsResult.status === "fulfilled") {
				setFriends((friendsResult.value || []) as FriendRow[]);
			}
			if (requestsResult.status === "fulfilled") {
				setFriendRequests((requestsResult.value || []) as FriendRequestRow[]);
			}
		} catch {
			Alert.alert("Could not load social activity", "Please try again shortly.");
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
		async function runSearch() {
			try {
				const results = await searchUsers(searchQuery.trim());
				if (!active) return;
				setSearchResults(
					(results || []).filter(
						(user) =>
							user.id !== currentUser?.id &&
							!friends.some((friend) => {
								const friendId = String(
									friend.id ?? friend.friend_id ?? friend.user_id ?? "",
								);
								return friendId && friendId === user.id;
							}),
					),
				);
			} catch {
				if (active) setSearchResults([]);
			}
		}
		void runSearch();
		return () => {
			active = false;
		};
	}, [currentUser, friends, searchQuery]);

	const friendCount = friends.length;
	const pendingCount = friendRequests.length;

	const displayName = useMemo(() => {
		if (!selectedProfile) return "";
		return selectedProfile.username || "Friend";
	}, [selectedProfile]);
	const selectedStreak = Number(
		selectedProfile?.streakCount ?? selectedProfile?.streakcount ?? 0,
	);
	const selectedExperience = Number(
		selectedProfile?.experience_level ?? selectedProfile?.experienceLevel ?? 0,
	);

	async function handleAddFriend(user: SearchUserResult) {
		if (!currentUser || !user.id) return;
		setSending(true);
		try {
			await sendFriendRequest(user.id);
			Alert.alert("Friend request sent", `Your request to ${user.username} is on the way.`);
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

	async function handleRequestAction(requestId: number | undefined, accept: boolean) {
		if (requestId === undefined || requestId === null) return;
		setResponding(true);
		try {
			await respondToFriendRequest(requestId, accept);
			Alert.alert(
				accept ? "Friend request accepted" : "Friend request declined",
				accept ? "You’re now connected." : "The request was removed.",
			);
			await loadSocialData();
		} catch (error) {
			Alert.alert(
				"Action failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setResponding(false);
		}
	}

	async function openFriendProfile(friend: FriendRow) {
		const friendId = String(
			friend.id ?? friend.friend_id ?? friend.user_id ?? friend.profile_id ?? "",
		);
		if (!friendId) return;
		try {
			const profile = await fetchUserProfile(friendId);
			setSelectedProfile(profile ?? null);
		} catch {
			Alert.alert("Profile unavailable", "This friend’s profile could not be loaded right now.");
		}
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
					initial={firstName.charAt(0).toUpperCase()}
				/>

				<View style={styles.section}>
					<SectionHeading
						title="Add friends"
						subtitle="Search by username to send a request."
					/>
					<TextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search users"
						placeholderTextColor={AppTheme.muted}
						style={styles.search}
					/>
					{searchQuery.trim() ? (
						searchResults.length ? (
							<View style={styles.list}>
								{searchResults.map((user) => (
									<View key={user.id} style={styles.userRow}>
										<View style={styles.userMeta}>
											<Image
												source={{ uri: user.pfp_url?.trim() || DEFAULT_PROFILE_IMAGE }}
												style={styles.userAvatar}
											/>
											<Text style={styles.userName}>{user.username}</Text>
										</View>
										<Pressable
											disabled={sending}
											onPress={() => handleAddFriend(user)}
											style={[styles.actionButton, sending && styles.disabled]}
										>
											<Text style={styles.actionText}>Add</Text>
										</Pressable>
									</View>
								))}
							</View>
						) : (
							<Text style={styles.empty}>No matching users found.</Text>
						)
					) : (
						<Text style={styles.empty}>Start typing to find people to follow.</Text>
					)}
				</View>

				<View style={styles.section}>
					<SectionHeading
						title="Friend requests"
						subtitle={`${pendingCount} pending request${pendingCount === 1 ? "" : "s"}`}
					/>
					{loading ? (
						<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
					) : friendRequests.length ? (
						<View style={styles.list}>
							{friendRequests.map((request, index) => {
								const requestId = Number(request.request_id ?? request.friendship_id ?? request.id ?? 0);
								const senderName = String(
									request.sender_username || request.username || "Friend",
								);
								const key = requestId || `${senderName}-${index}`;
								return (
									<View key={key} style={styles.userRow}>
										<View style={styles.userMeta}>
											<View style={styles.userAvatarMini}>
												<Text style={styles.userInitial}>{senderName.charAt(0).toUpperCase()}</Text>
											</View>
											<Text style={styles.userName}>{senderName}</Text>
										</View>
										<View style={styles.inlineActions}>
											<Pressable
												disabled={responding || !requestId}
												onPress={() => handleRequestAction(requestId, true)}
												style={[styles.confirmButton, (responding || !requestId) && styles.disabled]}
											>
												<Text style={styles.confirmText}>Accept</Text>
											</Pressable>
											<Pressable
												disabled={responding || !requestId}
												onPress={() => handleRequestAction(requestId, false)}
												style={[styles.rejectButton, (responding || !requestId) && styles.disabled]}
											>
												<Text style={styles.rejectText}>Reject</Text>
											</Pressable>
										</View>
									</View>
								);
								})}
							</View>
					) : (
						<Text style={styles.empty}>No pending requests right now.</Text>
					)}
				</View>

				<View style={styles.section}>
					<SectionHeading
						title="Your friends"
						subtitle={`${friendCount} connected${friendCount === 1 ? "" : ""}`}
					/>
					{loading ? (
						<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
					) : friends.length ? (
						<View style={styles.list}>
							{friends.map((friend, index) => {
								const name = String(
									friend.username ||
										friend.display_name ||
										friend.friend_username ||
										"Friend",
								);
								const friendId = String(
									friend.id ?? friend.friend_id ?? friend.user_id ?? friend.profile_id ?? index,
								);
								return (
									<Pressable
										key={friendId}
										onPress={() => openFriendProfile(friend)}
										style={styles.userRow}
									>
										<View style={styles.userMeta}>
											<View style={styles.userAvatarMini}>
												<Text style={styles.userInitial}>{name.charAt(0).toUpperCase()}</Text>
											</View>
											<Text style={styles.userName}>{name}</Text>
										</View>
										<Text style={styles.viewProfile}>View profile</Text>
									</Pressable>
								);
								})}
						</View>
					) : (
						<Text style={styles.empty}>You haven’t connected with anyone yet.</Text>
					)}
				</View>

				{selectedProfile && (
					<View style={styles.profileCard}>
						<Text style={styles.sectionTitle}>Friend profile</Text>
						<View style={styles.profileHeader}>
							<Image
								source={{ uri: selectedProfile.pfp_url?.trim() || DEFAULT_PROFILE_IMAGE }}
								style={styles.profileAvatar}
							/>
							<View>
								<Text style={styles.profileName}>{displayName}</Text>
								<Text style={styles.profileMeta}>BetterBite member</Text>
							</View>
						</View>
						{selectedProfileLoading ? (
							<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
						) : (
							<View style={styles.statsRow}>
								<View style={styles.statBox}>
									<Text style={styles.statValue}>{selectedProfilePosts.length}</Text>
									<Text style={styles.statLabel}>Recipes</Text>
								</View>
								<View style={styles.statBox}>
									<Text style={styles.statValue}>{selectedExperience || 0}</Text>
									<Text style={styles.statLabel}>Level</Text>
								</View>
								<View style={styles.statBox}>
									<Text style={styles.statValue}>{selectedStreak}</Text>
									<Text style={styles.statLabel}>Streak</Text>
								</View>
							</View>
						)}
						<Pressable onPress={() => setSelectedProfile(null)} style={styles.closeProfile}>
							<Text style={styles.closeProfileText}>Close</Text>
						</Pressable>
					</View>
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
		paddingBottom: 48,
	},
	section: {
		marginTop: 26,
		paddingBottom: 6,
	},
	search: {
		height: 48,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: AppTheme.border,
		backgroundColor: AppTheme.surface,
		color: AppTheme.text,
		paddingHorizontal: 14,
		fontSize: 15,
		marginTop: 12,
	},
	list: { gap: 12, marginTop: 14 },
	userRow: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: AppTheme.border,
		backgroundColor: AppTheme.surface,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	userMeta: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
	userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppTheme.accentSoft },
	userAvatarMini: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	userInitial: { color: AppTheme.accent, fontSize: 12, fontWeight: "700" },
	userName: { color: AppTheme.text, fontSize: 14, fontWeight: "600" },
	actionButton: {
		backgroundColor: AppTheme.accent,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
	inlineActions: { flexDirection: "row", gap: 8 },
	confirmButton: {
		backgroundColor: AppTheme.accent,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	confirmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
	rejectButton: {
		backgroundColor: "#F4E2E0",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	rejectText: { color: "#B65345", fontSize: 12, fontWeight: "700" },
	viewProfile: { color: AppTheme.accent, fontSize: 12, fontWeight: "700" },
	profileCard: {
		marginTop: 26,
		backgroundColor: AppTheme.surface,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: AppTheme.border,
		padding: 18,
	},
	sectionTitle: { color: AppTheme.text, fontSize: 18, fontWeight: "700" },
	profileHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16 },
	profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppTheme.accentSoft },
	profileName: { color: AppTheme.text, fontSize: 20, fontWeight: "700" },
	profileMeta: { color: AppTheme.muted, fontSize: 13, marginTop: 3 },
	statsRow: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "space-around",
		marginTop: 22,
		paddingTop: 18,
		borderTopWidth: 1,
		borderTopColor: AppTheme.border,
	},
	statBox: { alignItems: "center" },
	statValue: { color: AppTheme.accent, fontSize: 21, fontWeight: "600" },
	statLabel: { color: AppTheme.muted, fontSize: 12, marginTop: 4 },
	closeProfile: { marginTop: 16, alignSelf: "flex-start" },
	closeProfileText: { color: AppTheme.accent, fontSize: 13, fontWeight: "700" },
	loading: { marginVertical: 18 },
	empty: { color: AppTheme.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
	disabled: { opacity: 0.55 },
});
