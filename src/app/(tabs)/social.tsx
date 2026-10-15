import { ScreenHeader } from "@/components/screen-header";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { PressableScale } from "@/components/ui/pressable-scale";
import { TagChip } from "@/components/ui/tag-chip";
import { getActiveStreak } from "@/lib/streak";
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
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeIn as FadeInAnimation, FadeInDown } from "react-native-reanimated";
import { colors, layout, radii, shadowSm } from "./theme";

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

const LEADERBOARD_METRICS: { value: LeaderboardMetric; label: string; icon: IconName }[] = [
	{ value: "streak", label: "Streak", icon: "flame" },
	{ value: "xp", label: "Lifetime XP", icon: "sparkles" },
	{ value: "cookedPosts", label: "Cooked posts", icon: "pan" },
	{ value: "createdPosts", label: "Created posts", icon: "edit" },
];

/** Gold, silver and bronze for the top three ranks. */
const MEDALS = [colors.gold, colors.silver, colors.bronze];

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
		streak: getActiveStreak(value.streakCount ?? value.streakcount ?? value.streak_count ?? value.streak, (value.last_streak_post ?? value.last_post_at) as string | null | undefined),
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
	const [searchFocused, setSearchFocused] = useState(false);

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

	const selectedMetric = LEADERBOARD_METRICS.find((item) => item.value === leaderboardMetric) ?? LEADERBOARD_METRICS[0];
	const podiumEntries = [leaderboardEntries[1], leaderboardEntries[0], leaderboardEntries[2]]
		.filter((entry): entry is LeaderboardEntry => entry !== undefined);

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ ...styles.content, paddingTop: 4, paddingBottom: 90 }}
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
			<ScreenHeader title="Social" />
			{actionError ? (
				<Animated.View entering={FadeInAnimation} style={styles.errorBanner}>
					<AppIcon name="close" size={12} color={colors.danger} weight="bold" />
					<Text style={styles.errorText}>{actionError}</Text>
				</Animated.View>
			) : null}

			{/* LEADERBOARD */}
			<FadeIn delay={60} style={[styles.panel, shadowSm]}>
				<View style={styles.panelHeader}>
					<View style={styles.headingRow}>
						<IconBadge name="trophy" size={34} color={colors.gold} backgroundColor="#F8EED6" />
						<View style={{ flexShrink: 1 }}>
							<Text style={styles.heading}>Top {selectedMetric.label}</Text>
							<Text style={styles.headingSub}>{leaderboardAudience === "friends" ? "Among your friends" : "Across BetterBite"}</Text>
						</View>
					</View>
					<PressableScale onPress={() => setShowLeaderboard((value) => !value)} style={styles.linkButton} hoverStyle={styles.linkButtonHover} accessibilityRole="button">
						<Text style={styles.link}>{showLeaderboard ? "Hide" : "Full board"}</Text>
						<AppIcon name="chevronDown" size={12} color={colors.sage} weight="bold" style={{ transform: [{ rotate: showLeaderboard ? "180deg" : "0deg" }] }} />
					</PressableScale>
				</View>
				{showLeaderboard && (
					<Animated.View entering={FadeInDown.duration(240)} style={styles.leaderboardControls}>
						<Text style={styles.controlLabel}>Rank by</Text>
						<View style={styles.controlOptions}>
							{LEADERBOARD_METRICS.map((metric) => (
								<TagChip key={metric.value} size="sm" icon={metric.icon} label={metric.label} selected={leaderboardMetric === metric.value} onPress={() => setLeaderboardMetric(metric.value)} />
							))}
						</View>
						<Text style={styles.controlLabel}>Show</Text>
						<View style={styles.controlOptions}>
							{(["friends", "everyone"] as const).map((audience) => (
								<TagChip key={audience} size="sm" icon={audience === "friends" ? "social" : "globe"} label={audience === "friends" ? "Friends" : "Everyone"} selected={leaderboardAudience === audience} onPress={() => setLeaderboardAudience(audience)} />
							))}
						</View>
					</Animated.View>
				)}
				{leaderboardLoading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : leaderboardError ? (
					<EmptyState tone="error" icon="trophy" title="Leaderboard unavailable" message={leaderboardError} action={<Button title="Try again" icon="refresh" size="sm" variant="outline" onPress={() => setLeaderboardRefresh((value) => value + 1)} />} />
				) : leaderboardEntries.length === 0 ? (
					<EmptyState icon="trophy" title="No rankings yet" message="Cook and share recipes to climb the board." />
				) : <>
					<View style={styles.podiumRow}>{podiumEntries.map((entry, index) => {
						const avatar = { initials: initialsFor(entry.username), color: FRIEND_COLORS[index % FRIEND_COLORS.length], img: entry.pfp_url ?? undefined };
						const medal = MEDALS[entry.rank - 1];
						const blockStyle = entry.rank === 1 ? styles.firstBlock : entry.rank === 2 ? styles.secondBlock : styles.thirdBlock;
						return (
							<FadeIn key={entry.profile_id} delay={entry.rank === 1 ? 120 : entry.rank === 2 ? 220 : 300}>
								<PressableScale onPress={() => router.push(`/profile/${entry.profile_id}`)} pressScale={0.95} hoverLift={3} style={[styles.podiumEntry, index !== 1 && styles.podiumLower]} accessibilityRole="button" accessibilityLabel={`Rank ${entry.rank}, ${entry.username}`}>
									{medal ? <AppIcon name={entry.rank === 1 ? "trophy" : "medal"} size={entry.rank === 1 ? 22 : 18} color={medal} /> : <Text style={styles.rank}>#{entry.rank}</Text>}
									<View style={[styles.podiumAvatar, medal ? { borderColor: medal } : null]}>
										<Avatar friend={avatar} size={entry.rank === 1 ? 56 : 42} />
									</View>
									<Text numberOfLines={1} style={styles.podiumName}>{entry.username}</Text>
									<Text style={styles.points}>{entry.score.toLocaleString()} {leaderboardScoreLabel(leaderboardMetric)}</Text>
									<View style={[styles.podiumBlock, blockStyle]}>
										<Text style={styles.podiumBlockText}>{entry.rank}</Text>
									</View>
								</PressableScale>
							</FadeIn>
						);
					})}</View>
					{showLeaderboard && <View style={styles.leaderboard}>{leaderboardEntries.map((entry, index) => {
						const avatar = { initials: initialsFor(entry.username), color: FRIEND_COLORS[index % FRIEND_COLORS.length], img: entry.pfp_url ?? undefined };
						const medal = MEDALS[entry.rank - 1];
						return (
							<Animated.View key={entry.profile_id} entering={FadeInDown.delay(Math.min(index, 10) * 30).duration(240)}>
								<PressableScale onPress={() => router.push(`/profile/${entry.profile_id}`)} pressScale={0.98} style={styles.leaderRow} hoverStyle={styles.rowHover} accessibilityRole="button">
									<View style={styles.leaderRankBox}>
										{medal ? <AppIcon name="medal" size={15} color={medal} /> : <Text style={styles.leaderRank}>{entry.rank}</Text>}
									</View>
									<Avatar friend={avatar} size={32} />
									<Text numberOfLines={1} style={styles.leaderName}>{entry.username}</Text>
									<View style={styles.scorePill}>
										<AppIcon name={selectedMetric.icon} size={10} color={colors.sage} />
										<Text style={styles.scoreText}>{entry.score.toLocaleString()} {leaderboardScoreLabel(leaderboardMetric)}</Text>
									</View>
								</PressableScale>
							</Animated.View>
						);
					})}</View>}
				</>}
			</FadeIn>

			{/* ADD FRIENDS */}
			<FadeIn delay={120} style={styles.section}>
				<SectionLabel icon="personAdd">Add friends</SectionLabel>
				<View style={[styles.searchBox, shadowSm, searchFocused && styles.searchBoxFocused]}>
					<AppIcon name="search" size={17} color={searchFocused ? colors.sage : colors.muted} />
					<TextInput value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search users" placeholderTextColor={colors.faint} style={styles.searchInput} autoCapitalize="none" />
					{searchQuery.length > 0 && (
						<PressableScale onPress={() => setSearchQuery("")} hitSlop={8} style={styles.clearCircle} hoverStyle={styles.clearCircleHover} accessibilityRole="button" accessibilityLabel="Clear search">
							<AppIcon name="close" size={11} color={colors.muted} weight="bold" />
						</PressableScale>
					)}
				</View>
				<View style={[styles.listPanel, shadowSm]}>
					{searchLoading ? (
						<ActivityIndicator color={colors.sage} style={styles.inlineLoading} />
					) : searchQuery.trim() && searchResults.length === 0 ? (
						<EmptyState icon="search" title="No users found" message={`Nobody matches "${searchQuery}" yet.`} />
					) : searchQuery.trim() ? searchResults.map((user, index) => {
						const added = addedIds.has(user.id);
						return (
							<Animated.View key={user.id} entering={FadeInDown.delay(index * 40).duration(220)} style={[styles.userRow, index < searchResults.length - 1 && styles.rowBorder]}>
								<PressableScale onPress={() => router.push(`/profile/${user.id}`)} pressScale={0.98} style={styles.profileLink} accessibilityRole="button">
									<Avatar friend={{ initials: user.initials, color: user.color, img: user.pfp_url ?? undefined }} />
									<View style={styles.userInfo}>
										<Text style={styles.userName}>{user.username}</Text>
										{user.tier ? <TierBadge tier={user.tier} /> : null}
									</View>
								</PressableScale>
								<Button
									title={added ? "Sent" : "Add"}
									icon={added ? "check" : "personAdd"}
									variant={added ? "secondary" : "primary"}
									size="sm"
									disabled={added}
									onPress={() => void handleSendRequest(user)}
								/>
							</Animated.View>
						);
					}) : (
						<View style={styles.searchHint}>
							<AppIcon name="wave" size={16} color={colors.clay} />
							<Text style={styles.searchHintText}>Search by username to find friends.</Text>
						</View>
					)}
				</View>
			</FadeIn>

			{/* FRIEND REQUESTS */}
			<FadeIn delay={180} style={styles.section}>
				<View style={styles.sectionTitleRow}>
					<SectionLabel icon="mail">Friend requests</SectionLabel>
					{requests.length > 0 && <View style={styles.requestCount}><Text style={styles.requestCountText}>{requests.length}</Text></View>}
				</View>
				{loading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : requests.length === 0 ? (
					<View style={[styles.listPanel, shadowSm]}>
						<EmptyState icon="mail" title="No pending requests" message="New friend requests will show up here." />
					</View>
				) : (
					<View style={[styles.listPanel, shadowSm]}>
						{requests.map((request, index) => (
							<View key={request.id} style={[styles.userRow, index < requests.length - 1 && styles.rowBorder]}>
								<Avatar friend={request} />
								<View style={styles.userInfo}>
									<Text style={styles.userName}>{request.name}</Text>
									<Text style={styles.mutuals}>{request.mutuals ? `${request.mutuals} mutual friends` : "Wants to connect with you"}</Text>
								</View>
								<PressableScale onPress={() => void handleRequestResponse(request, false)} pressScale={0.9} style={[styles.iconAction, styles.rejectButton]} hoverStyle={styles.rejectButtonHover} accessibilityRole="button" accessibilityLabel={`Reject ${request.name}`}>
									<AppIcon name="close" size={14} color={colors.terracotta} weight="bold" />
								</PressableScale>
								<PressableScale onPress={() => void handleRequestResponse(request, true)} pressScale={0.9} style={[styles.iconAction, styles.acceptButton]} hoverStyle={styles.acceptButtonHover} accessibilityRole="button" accessibilityLabel={`Accept ${request.name}`}>
									<AppIcon name="check" size={14} color="#fff" weight="bold" />
								</PressableScale>
							</View>
						))}
					</View>
				)}
			</FadeIn>

			{/* FRIENDS */}
			<FadeIn delay={240} style={styles.section}>
				<View style={styles.sectionTitleRow}>
					<SectionLabel icon="social">Your friends</SectionLabel>
					<Text style={styles.friendCount}>{friends.length} {friends.length === 1 ? "friend" : "friends"}</Text>
				</View>
				{loading ? <ActivityIndicator color={colors.sage} style={styles.inlineLoading} /> : friends.length === 0 ? (
					<View style={[styles.listPanel, shadowSm]}>
						<EmptyState icon="social" title="No friends yet" message="Find friends above to cook together." />
					</View>
				) : (
					<View style={[styles.listPanel, shadowSm]}>
						{friends.map((friend, index) => (
							<PressableScale key={friend.id} onPress={() => router.push(`/profile/${friend.id}`)} pressScale={0.98} style={[styles.userRow, index < friends.length - 1 && styles.rowBorder]} hoverStyle={styles.rowHover} accessibilityRole="button" accessibilityLabel={`Open ${friend.name}'s profile`}>
								<Avatar friend={friend} />
								<View style={styles.userInfo}>
									<View style={styles.nameTierRow}><Text style={styles.userName}>{friend.name}</Text><TierBadge tier={friend.tier} /></View>
									<View style={styles.streakRow}>
										<AppIcon name="flame" size={11} color={friend.streak > 0 ? colors.sage : colors.ghost} />
										<Text style={styles.mutuals}>{friend.streak} day streak</Text>
									</View>
								</View>
								<AppIcon name="chevronRight" size={14} color={colors.ghost} weight="semibold" />
							</PressableScale>
						))}
					</View>
				)}
			</FadeIn>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	fill: { width: "100%", height: "100%" },
	content: { paddingBottom: 32 },
	errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: layout.gutter, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.dangerBg },
	errorText: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.danger },
	inlineLoading: { height: 80 },
	section: { paddingHorizontal: layout.gutter, marginBottom: layout.sectionGap },
	panel: { marginHorizontal: layout.gutter, marginBottom: layout.sectionGap, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
	panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 },
	headingRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
	heading: { fontSize: 15, fontWeight: "800", color: colors.ink },
	headingSub: { fontSize: 11, fontWeight: "500", color: colors.muted, marginTop: 1 },
	linkButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.sageLight },
	linkButtonHover: { backgroundColor: "#DCE6D6" },
	link: { fontSize: 11, fontWeight: "800", color: colors.sage },
	podiumRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 16 },
	podiumEntry: { alignItems: "center", gap: 4 },
	podiumLower: { marginBottom: -4 },
	podiumAvatar: { borderRadius: radii.pill, borderWidth: 2, borderColor: colors.divider, padding: 2 },
	rank: { fontSize: 13, fontWeight: "800", color: colors.faint },
	podiumName: { maxWidth: 80, fontSize: 12, fontWeight: "700", color: colors.ink },
	points: { fontSize: 10, fontWeight: "600", color: colors.muted },
	podiumBlock: { width: 64, alignItems: "center", justifyContent: "center", borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 4 },
	podiumBlockText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.95)" },
	firstBlock: { height: 34, backgroundColor: colors.gold },
	secondBlock: { height: 24, backgroundColor: colors.silver },
	thirdBlock: { height: 18, backgroundColor: colors.bronze },
	leaderboard: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, gap: 2 },
	leaderboardControls: { gap: 8, marginBottom: 18 },
	controlLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 1 },
	controlOptions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
	leaderRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, paddingVertical: 7, borderRadius: radii.md },
	rowHover: { backgroundColor: colors.bg },
	leaderRankBox: { width: 20, alignItems: "center" },
	leaderRank: { fontSize: 12, fontWeight: "800", color: colors.faint },
	leaderName: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.ink },
	scorePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.sageLight },
	scoreText: { fontSize: 10, fontWeight: "800", color: colors.sage },
	searchBox: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
	searchBoxFocused: { borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
	searchInput: { flex: 1, padding: 0, fontSize: 14, fontWeight: "500", color: colors.ink },
	clearCircle: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.divider },
	clearCircleHover: { backgroundColor: colors.border },
	listPanel: { overflow: "hidden", borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
	userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
	rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
	avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
	avatarText: { color: "#fff", fontSize: 11, fontWeight: "800" },
	userInfo: { flex: 1, minWidth: 0 },
	profileLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	userName: { fontSize: 14, fontWeight: "700", color: colors.ink, lineHeight: 18 },
	nameTierRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
	streakRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
	tierBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
	tierText: { fontSize: 9, fontWeight: "800" },
	mutuals: { marginTop: 2, fontSize: 11, fontWeight: "500", color: colors.muted },
	searchHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bg },
	searchHintText: { fontSize: 12, fontWeight: "600", color: colors.muted },
	requestCount: { marginBottom: 10, minWidth: 18, alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.flame },
	requestCountText: { color: "#fff", fontSize: 9, fontWeight: "800" },
	sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	iconAction: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
	rejectButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
	rejectButtonHover: { borderColor: colors.clay, backgroundColor: colors.terraBg },
	acceptButton: { backgroundColor: colors.sage },
	acceptButtonHover: { backgroundColor: colors.sageDark },
	friendCount: { marginLeft: "auto", marginBottom: 10, fontSize: 11, fontWeight: "600", color: colors.muted },
});
