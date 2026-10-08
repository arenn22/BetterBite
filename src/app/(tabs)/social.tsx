import { ScreenHeader } from "@/components/screen-header";
import { SectionLabel } from "@/components/section-label";
import {
	fetchFriendRequests,
	fetchFriends,
	getLifetimeCookedPostsLeaderboardFromEveryone,
	getLifetimeCookedPostsLeaderboardFromFriends,
	getLifetimeCreatedPostsLeaderboardFromEveryone,
	getLifetimeCreatedPostsLeaderboardFromFriends,
	getLifetimeXPLeaderboardFromEveryone,
	getLifetimeXPLeaderboardFromFriends,
	getStreakLeaderboardFromEveryone,
	getStreakLeaderboardFromFriends,
	respondToFriendRequest,
	searchUsers,
	sendFriendRequest,
} from "@/services/api/social";
import type { SearchUserResult } from "@/types/auth";
import type { LeaderboardEntry, PendingFriendRequest } from "@/types/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { colors, fonts, shadowSm } from "./theme";

type Friend = {
	id: string;
	name: string;
	initials: string;
	color: string;
	tier: string;
	streak: number;
	recipes: number;
	level: number;
	recentImgs: string[];
	img?: string;
};

type Request = PendingFriendRequest & { name: string; initials: string; color: string; mutuals: number };
type SuggestedUser = SearchUserResult & { initials: string; color: string; tier?: string };
type LeaderboardMetric = "streak" | "xp" | "cookedPosts" | "createdPosts";
type LeaderboardAudience = "everyone" | "friends";

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
	Beginner: { bg: "#F0F0EC", text: "#7A7A72" },
	"Home Cook": { bg: colors.sageLight, text: colors.sage },
	Chef: { bg: "#FDF0EA", text: colors.terracotta },
	"Sous Chef": { bg: "#FDE8DC", text: "#B5603A" },
	Master: { bg: "#F5EAD6", text: "#9B6B2A" },
};

const FRIEND_COLORS = ["#D9A28B", colors.sage, "#9B6B2A", "#8A9E7A", "#B5603A", colors.muted];

const LEADERBOARD_FETCHERS: Record<LeaderboardMetric, Record<LeaderboardAudience, () => Promise<LeaderboardEntry[]>>> = {
	streak: {
		everyone: getStreakLeaderboardFromEveryone,
		friends: getStreakLeaderboardFromFriends,
	},
	xp: {
		everyone: getLifetimeXPLeaderboardFromEveryone,
		friends: getLifetimeXPLeaderboardFromFriends,
	},
	cookedPosts: {
		everyone: getLifetimeCookedPostsLeaderboardFromEveryone,
		friends: getLifetimeCookedPostsLeaderboardFromFriends,
	},
	createdPosts: {
		everyone: getLifetimeCreatedPostsLeaderboardFromEveryone,
		friends: getLifetimeCreatedPostsLeaderboardFromFriends,
	},
};

const LEADERBOARD_METRICS: { value: LeaderboardMetric; label: string }[] = [
	{ value: "streak", label: "Streak" },
	{ value: "xp", label: "Lifetime XP" },
	{ value: "cookedPosts", label: "Cooked posts" },
	{ value: "createdPosts", label: "Created posts" },
];

function leaderboardScoreLabel(metric: LeaderboardMetric): string {
	switch (metric) {
		case "streak":
			return "days";
		case "xp":
			return "XP";
		case "cookedPosts":
			return "cooked";
		case "createdPosts":
			return "posts";
	}
}

function initialsFor(name: string) {
	return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeFriend(value: Record<string, unknown>, index: number): Friend {
	const name = String(value.username ?? value.friend_username ?? value.display_name ?? value.name ?? "Friend");
	return {
		id: String(value.id ?? value.profile_id ?? value.friend_id ?? index),
		name,
		initials: initialsFor(name),
		color: FRIEND_COLORS[index % FRIEND_COLORS.length],
		tier: String(value.tier ?? value.experience_level_name ?? "Member"),
		streak: Number(value.streakCount ?? value.streakcount ?? value.streak ?? 0) || 0,
		recipes: Number(value.recipe_count ?? value.recipes ?? 0) || 0,
		level: Number(value.experience_level ?? value.level ?? 0) || 0,
		recentImgs: Array.isArray(value.recent_images) ? value.recent_images.filter((image): image is string => typeof image === "string") : [],
		img: typeof value.pfp_url === "string" ? value.pfp_url : typeof value.friend_pfp_url === "string" ? value.friend_pfp_url : undefined,
	};
}

function normalizeRequest(value: PendingFriendRequest, index: number): Request {
	const name = value.sender_username ?? value.username ?? value.display_name ?? "Friend request";
	return {
		...value,
		name,
		initials: initialsFor(name),
		color: FRIEND_COLORS[index % FRIEND_COLORS.length],
		mutuals: 0,
	};
}

function Avatar({ friend, size = 40 }: { friend: Pick<Friend, "initials" | "color" | "img">; size?: number }) {
	return (
		<View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: friend.color }]}>
			{friend.img ? <Image source={{ uri: friend.img }} style={styles.fill} /> : <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>{friend.initials}</Text>}
		</View>
	);
}

function TierBadge({ tier }: { tier: string }) {
	const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.Beginner;
	return <View style={[styles.tierBadge, { backgroundColor: tierColor.bg }]}><Text style={[styles.tierText, { color: tierColor.text }]}>{tier}</Text></View>;
}

export default function SocialScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
	const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
	const [requests, setRequests] = useState<Request[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchLoading, setSearchLoading] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>("streak");
	const [leaderboardAudience, setLeaderboardAudience] = useState<LeaderboardAudience>("friends");
	const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
	const [leaderboardLoading, setLeaderboardLoading] = useState(true);
	const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
	const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
	const [socialRefresh, setSocialRefresh] = useState(0);
	const [socialRefreshing, setSocialRefreshing] = useState(false);
	const [leaderboardRefreshing, setLeaderboardRefreshing] = useState(false);

	useEffect(() => {
		let active = true;
		async function loadSocialData() {
			setLoading(true);
			try {
				const [friendRows, requestRows] = await Promise.all([fetchFriends(), fetchFriendRequests()]);
				if (!active) return;
				setFriends((Array.isArray(friendRows) ? friendRows : []).map((friend, index) => normalizeFriend(friend as Record<string, unknown>, index)));
				setRequests(requestRows.map(normalizeRequest));
			} catch (error) {
				if (active) setActionError(error instanceof Error ? error.message : "Unable to load your social connections.");
			} finally {
				if (active) {
					setLoading(false);
					setSocialRefreshing(false);
				}
			}
		}
		void loadSocialData();
		return () => { active = false; };
	}, [socialRefresh]);

	useEffect(() => {
		let active = true;
		setLeaderboardLoading(true);
		setLeaderboardError(null);

		void LEADERBOARD_FETCHERS[leaderboardMetric][leaderboardAudience]()
			.then((entries) => {
				if (active) setLeaderboardEntries(entries);
			})
			.catch((error: unknown) => {
				if (!active) return;
				setLeaderboardEntries([]);
				setLeaderboardError(error instanceof Error ? error.message : "Unable to load the leaderboard.");
			})
			.finally(() => {
				if (active) {
					setLeaderboardLoading(false);
					setLeaderboardRefreshing(false);
				}
			});

		return () => { active = false; };
	}, [leaderboardMetric, leaderboardAudience, leaderboardRefresh]);

	useEffect(() => {
		const query = searchQuery.trim();
		if (!query) {
			setSearchResults([]);
			return;
		}
		let active = true;
		setSearchLoading(true);
		void searchUsers(query).then((results) => {
			if (active) {
				setSearchResults(results.map((user, index) => ({ ...user, initials: initialsFor(user.username), color: FRIEND_COLORS[index % FRIEND_COLORS.length] })));
			}
		}).catch((error) => {
			if (active) setActionError(error instanceof Error ? error.message : "Unable to search users.");
		}).finally(() => {
			if (active) setSearchLoading(false);
		});
		return () => { active = false; };
	}, [searchQuery]);

	const handleSendRequest = async (user: SuggestedUser) => {
		try {
			await sendFriendRequest(user.id);
			setAddedIds((current) => new Set(current).add(user.id));
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Unable to send friend request.");
		}
	};

	const handleRequestResponse = async (request: Request, accept: boolean) => {
		try {
			await respondToFriendRequest(request.id, accept);
			setRequests((current) => current.filter((item) => item.id !== request.id));
			if (accept) {
				const friendRows = await fetchFriends();
				setFriends((Array.isArray(friendRows) ? friendRows : []).map((friend, index) => normalizeFriend(friend as Record<string, unknown>, index)));
			}
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Unable to update friend request.");
		}
	};

	const selectedMetricLabel = LEADERBOARD_METRICS.find((item) => item.value === leaderboardMetric)?.label ?? "Streak";
	const podiumEntries = [leaderboardEntries[1], leaderboardEntries[0], leaderboardEntries[2]]
		.filter((entry): entry is LeaderboardEntry => entry !== undefined);
	const rankLabels = ["🥇", "🥈", "🥉"];

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
			refreshControl={Platform.OS === "web" ? undefined : (
				<RefreshControl
					refreshing={socialRefreshing || leaderboardRefreshing}
					onRefresh={() => {
						setSocialRefreshing(true);
						setLeaderboardRefreshing(true);
						setSocialRefresh((refresh) => refresh + 1);
						setLeaderboardRefresh((refresh) => refresh + 1);
					}}
					tintColor={colors.sage}
					colors={[colors.sage]}
				/>
			)}
		>
			<ScreenHeader eyebrow="Your crew" title="Social" subtitle="Add friends, manage requests, and check in with your people." />
			{actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

			<View style={[styles.panel, shadowSm]}>
				<View style={styles.panelHeader}><View style={styles.headingRow}><Text style={styles.headingIcon}>🏆</Text><Text style={styles.heading}>Top {selectedMetricLabel} · {leaderboardAudience}</Text></View><Pressable onPress={() => setShowLeaderboard((value) => !value)}><Text style={styles.link}>{showLeaderboard ? "Hide" : "See full leaderboard"} →</Text></Pressable></View>
				{showLeaderboard && <View style={styles.leaderboardControls}>
					<Text style={styles.controlLabel}>Rank by</Text>
					<View style={styles.controlOptions}>{LEADERBOARD_METRICS.map((metric) => <Pressable key={metric.value} accessibilityRole="button" accessibilityState={{ selected: leaderboardMetric === metric.value }} onPress={() => setLeaderboardMetric(metric.value)} style={[styles.controlButton, leaderboardMetric === metric.value && styles.controlButtonSelected]}><Text style={[styles.controlText, leaderboardMetric === metric.value && styles.controlTextSelected]}>{metric.label}</Text></Pressable>)}</View>
					<Text style={styles.controlLabel}>Show</Text>
					<View style={styles.controlOptions}>{(["friends", "everyone"] as const).map((audience) => <Pressable key={audience} accessibilityRole="button" accessibilityState={{ selected: leaderboardAudience === audience }} onPress={() => setLeaderboardAudience(audience)} style={[styles.controlButton, leaderboardAudience === audience && styles.controlButtonSelected]}><Text style={[styles.controlText, leaderboardAudience === audience && styles.controlTextSelected]}>{audience === "friends" ? "Friends" : "Everyone"}</Text></Pressable>)}</View>
				</View>}
				{leaderboardLoading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : leaderboardError ? <View style={styles.leaderboardMessage}><Text style={styles.leaderboardError}>{leaderboardError}</Text><Pressable onPress={() => setLeaderboardRefresh((value) => value + 1)}><Text style={styles.link}>Try again</Text></Pressable></View> : leaderboardEntries.length === 0 ? <Text style={styles.emptyText}>No leaderboard entries yet.</Text> : <>
					<View style={styles.podiumRow}>{podiumEntries.map((entry, index) => {
						const avatar = { initials: initialsFor(entry.username), color: FRIEND_COLORS[index % FRIEND_COLORS.length], img: entry.pfp_url ?? undefined };
						const blockStyle = entry.rank === 1 ? styles.firstBlock : entry.rank === 2 ? styles.secondBlock : styles.thirdBlock;
						return <View key={entry.profile_id} style={[styles.podiumEntry, index !== 1 && styles.podiumLower]}><Text style={styles.rank}>{rankLabels[entry.rank - 1] ?? `#${entry.rank}`}</Text><Avatar friend={avatar} size={entry.rank === 1 ? 56 : 40} /><Text numberOfLines={1} style={styles.podiumName}>{entry.username}</Text><Text style={styles.points}>{entry.score.toLocaleString()} {leaderboardScoreLabel(leaderboardMetric)}</Text><View style={[styles.podiumBlock, blockStyle]} /></View>;
					})}</View>
					{showLeaderboard && <View style={styles.leaderboard}>{leaderboardEntries.map((entry, index) => {
						const avatar = { initials: initialsFor(entry.username), color: FRIEND_COLORS[index % FRIEND_COLORS.length], img: entry.pfp_url ?? undefined };
						return <View key={entry.profile_id} style={styles.leaderRow}><Text style={styles.leaderRank}>{entry.rank}</Text><Avatar friend={avatar} size={32} /><Text style={styles.leaderName}>{entry.username}</Text><Text style={styles.points}>{entry.score.toLocaleString()} {leaderboardScoreLabel(leaderboardMetric)}</Text></View>;
					})}</View>}
				</>}
			</View>

			<View style={styles.section}><SectionLabel>Add friends</SectionLabel><View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users" placeholderTextColor={colors.faint} style={styles.searchInput} />{searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery("")}><Text style={styles.clear}>✕</Text></Pressable>}</View><View style={[styles.listPanel, shadowSm]}>{searchLoading ? <Text style={styles.emptyText}>Searching users…</Text> : searchQuery.trim() && searchResults.length === 0 ? <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text> : searchQuery.trim() ? searchResults.map((user, index) => { const added = addedIds.has(user.id); return <View key={user.id} style={[styles.userRow, index < searchResults.length - 1 && styles.rowBorder]}><Pressable onPress={() => router.push(`/profile/${user.id}`)} style={styles.profileLink}><View style={[styles.avatar, { backgroundColor: user.color }]}>{user.pfp_url ? <Image source={{ uri: user.pfp_url }} style={styles.fill} /> : <Text style={styles.avatarText}>{user.initials}</Text>}</View><View style={styles.userInfo}><Text style={styles.userName}>{user.username}</Text>{user.tier ? <TierBadge tier={user.tier} /> : null}</View></Pressable><Pressable onPress={() => void handleSendRequest(user)} disabled={added} style={[styles.actionButton, added ? styles.sentButton : styles.addButton]}><Text style={[styles.actionText, added && styles.sentText]}>{added ? "Sent ✓" : "+ Add"}</Text></Pressable></View>}) : <Text style={styles.suggestedFooter}>Search by username to find friends.</Text>}</View></View>

			<View style={styles.section}><View style={styles.sectionTitleRow}><SectionLabel>Friend requests</SectionLabel>{requests.length > 0 && <View style={styles.requestCount}><Text style={styles.requestCountText}>{requests.length}</Text></View>}</View>{loading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : requests.length === 0 ? <View style={[styles.emptyPanel, shadowSm]}><Text style={styles.emptyEmoji}>👐</Text><Text style={styles.emptyText}>No pending requests</Text></View> : <View style={[styles.listPanel, shadowSm]}>{requests.map((request, index) => <View key={request.id} style={[styles.userRow, index < requests.length - 1 && styles.rowBorder]}><View style={[styles.avatar, { backgroundColor: request.color }]}><Text style={styles.avatarText}>{request.initials}</Text></View><View style={styles.userInfo}><Text style={styles.userName}>{request.name}</Text><Text style={styles.mutuals}>{request.mutuals ? `${request.mutuals} mutual friends` : "Wants to connect with you"}</Text></View><Pressable onPress={() => void handleRequestResponse(request, false)} style={[styles.smallAction, styles.rejectButton]}><Text style={styles.rejectText}>Reject</Text></Pressable><Pressable onPress={() => void handleRequestResponse(request, true)} style={[styles.smallAction, styles.acceptButton]}><Text style={styles.acceptText}>Accept</Text></Pressable></View>)}</View>}</View>

			<View style={styles.section}><View style={styles.sectionTitleRow}><SectionLabel>Your friends</SectionLabel><Text style={styles.friendCount}>{friends.length} friends</Text></View>{loading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : friends.length === 0 ? <View style={[styles.emptyPanel, shadowSm]}><Text style={styles.emptyText}>No friends yet</Text></View> : <View style={[styles.listPanel, shadowSm]}>{friends.map((friend, index) => <Pressable key={friend.id} onPress={() => router.push(`/profile/${friend.id}`)} style={[styles.userRow, index < friends.length - 1 && styles.rowBorder]}><Avatar friend={friend} /><View style={styles.userInfo}><View style={styles.nameTierRow}><Text style={styles.userName}>{friend.name}</Text><TierBadge tier={friend.tier} /></View><Text style={styles.mutuals}>🔥 {friend.streak} day streak</Text></View></Pressable>)}</View>}</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	fill: { width: "100%", height: "100%" },
	content: { paddingBottom: 32 },
	errorText: { marginHorizontal: 16, marginBottom: 12, fontSize: 12, color: colors.terracotta },
	inlineLoading: { height: 80 },
	header: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 20 },
	eyebrow: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
	title: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
	subtitle: { fontSize: 14, lineHeight: 21, fontWeight: "500", color: colors.muted, marginTop: 4 },
	section: { paddingHorizontal: 16, marginBottom: 20 },
	sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
	panel: { marginHorizontal: 16, marginBottom: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
	panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
	headingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	headingIcon: { fontSize: 16 },
	heading: { fontSize: 14, fontWeight: "800", color: colors.ink },
	link: { fontSize: 11, fontWeight: "700", color: colors.sage },
	podiumRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 16 },
	podiumEntry: { alignItems: "center", gap: 4 },
	podiumLower: { marginBottom: -4 },
	rank: { fontSize: 16 },
	podiumName: { fontSize: 11, fontWeight: "700", color: colors.ink },
	points: { fontSize: 9, fontWeight: "600", color: colors.muted },
	podiumBlock: { width: 56, borderTopLeftRadius: 6, borderTopRightRadius: 6, marginTop: 2 },
	firstBlock: { height: 24, backgroundColor: colors.clay },
	secondBlock: { height: 16, backgroundColor: colors.sageLight },
	thirdBlock: { height: 12, backgroundColor: "#F0F0EC" },
	leaderboard: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.cream, gap: 8 },
	leaderboardControls: { gap: 8, marginBottom: 16 },
	controlLabel: { fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
	controlOptions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
	controlButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
	controlButtonSelected: { backgroundColor: colors.sageLight, borderColor: colors.sage },
	controlText: { fontSize: 10, fontWeight: "700", color: colors.muted },
	controlTextSelected: { color: colors.sage },
	leaderboardMessage: { alignItems: "center", gap: 4 },
	leaderboardError: { padding: 12, textAlign: "center", fontSize: 12, color: colors.terracotta },
	leaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	leaderRank: { width: 16, textAlign: "center", fontSize: 12, fontWeight: "800", color: colors.faint },
	leaderName: { flex: 1, fontSize: 12, fontWeight: "700", color: colors.ink },
	searchBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
	searchIcon: { fontSize: 21, color: colors.muted },
	searchInput: { flex: 1, padding: 0, fontSize: 14, color: colors.ink },
	clear: { color: colors.faint, fontSize: 12 },
	listPanel: { overflow: "hidden", borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
	userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
	rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.cream },
	openRow: { backgroundColor: colors.bg },
	avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
	avatarText: { color: "#fff", fontSize: 11, fontWeight: "800" },
	userInfo: { flex: 1, minWidth: 0 },
	profileLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	userName: { fontSize: 14, fontWeight: "700", color: colors.ink, lineHeight: 18 },
	nameTierRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
	tierBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
	tierText: { fontSize: 9, fontWeight: "800" },
	mutuals: { marginTop: 2, fontSize: 10, fontWeight: "500", color: colors.muted },
	actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
	addButton: { backgroundColor: colors.sage },
	sentButton: { backgroundColor: colors.sageLight },
	actionText: { fontSize: 12, fontWeight: "700", color: "#fff" },
	sentText: { color: colors.sage },
	suggestedFooter: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.cream, fontSize: 10, fontWeight: "600", color: colors.faint },
	emptyPanel: { alignItems: "center", paddingVertical: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
	emptyEmoji: { fontSize: 24, marginBottom: 4 },
	emptyText: { padding: 20, textAlign: "center", fontSize: 14, fontWeight: "500", color: colors.muted },
	requestCount: { marginTop: -10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.clay },
	requestCountText: { color: "#fff", fontSize: 9, fontWeight: "800" },
	sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	smallAction: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
	rejectButton: { borderWidth: 1, borderColor: colors.border },
	rejectText: { color: colors.terracotta, fontSize: 11, fontWeight: "700" },
	acceptButton: { backgroundColor: colors.sage },
	acceptText: { color: "#fff", fontSize: 11, fontWeight: "700" },
	friendCount: { marginTop: -10, fontSize: 10, fontWeight: "600", color: colors.muted },
	statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
	statBox: { flex: 1, alignItems: "center", padding: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
	statValue: { fontSize: 14, fontWeight: "800", color: colors.ink },
	statLabel: { marginTop: 2, fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
	recentLabel: { marginBottom: 8, fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
	recentRow: { flexDirection: "row", gap: 8 },
	recentImage: { flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: colors.sageLight },
});
