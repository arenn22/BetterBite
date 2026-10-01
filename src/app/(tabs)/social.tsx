import { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { colors, fonts, shadowSm } from "./theme";

type Friend = {
	id: number;
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

type Request = { id: number; name: string; initials: string; color: string; mutuals: number };
type SuggestedUser = { id: number; name: string; initials: string; color: string; tier: string };

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
	Beginner: { bg: "#F0F0EC", text: "#7A7A72" },
	"Home Cook": { bg: colors.sageLight, text: colors.sage },
	Chef: { bg: "#FDF0EA", text: colors.terracotta },
	"Sous Chef": { bg: "#FDE8DC", text: "#B5603A" },
	Master: { bg: "#F5EAD6", text: "#9B6B2A" },
};

const FRIENDS: Friend[] = [
	{ id: 1, name: "Maya K.", initials: "MK", color: "#D9A28B", tier: "Chef", streak: 12, recipes: 47, level: 8, recentImgs: ["https://images.unsplash.com/photo-1617474020181-e1d42f2245ea?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1788601299617-3052a7c8fa70?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1783196736270-d08d63485303?w=120&h=120&fit=crop&auto=format"], img: "https://images.unsplash.com/photo-1625631980683-825234bfb7d5?w=96&h=96&fit=crop&auto=format" },
	{ id: 2, name: "Tomás R.", initials: "TR", color: colors.sage, tier: "Home Cook", streak: 7, recipes: 23, level: 4, recentImgs: ["https://images.unsplash.com/photo-1773817728515-612df7f78e1b?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1667473775795-41f69ae72c44?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1528712518629-67d42968a45e?w=120&h=120&fit=crop&auto=format"] },
	{ id: 3, name: "Priya N.", initials: "PN", color: "#9B6B2A", tier: "Sous Chef", streak: 21, recipes: 61, level: 10, recentImgs: ["https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1617474019977-0e105d1b430e?w=120&h=120&fit=crop&auto=format"], img: "https://images.unsplash.com/photo-1625631980722-b728f9cf1036?w=96&h=96&fit=crop&auto=format" },
	{ id: 4, name: "Lena W.", initials: "LW", color: "#8A9E7A", tier: "Home Cook", streak: 5, recipes: 18, level: 3, recentImgs: ["https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1465014925804-7b9ede58d0d7?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1614955177711-2540ad25432b?w=120&h=120&fit=crop&auto=format"] },
	{ id: 5, name: "Carlos R.", initials: "CR", color: "#B5603A", tier: "Chef", streak: 9, recipes: 35, level: 6, recentImgs: ["https://images.unsplash.com/photo-1714683237282-4a4623333058?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1767514579388-278d63566fd7?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1699251775859-ef6a2f69ef5b?w=120&h=120&fit=crop&auto=format"], img: "https://images.unsplash.com/photo-1625631980777-823fc2938950?w=96&h=96&fit=crop&auto=format" },
	{ id: 6, name: "Sun Y.", initials: "SY", color: colors.muted, tier: "Beginner", streak: 2, recipes: 6, level: 1, recentImgs: ["https://images.unsplash.com/photo-1617474019991-689674c2d1ae?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1605522283494-4901a98d458e?w=120&h=120&fit=crop&auto=format", "https://images.unsplash.com/photo-1591459034470-d1e05d7b05d4?w=120&h=120&fit=crop&auto=format"] },
];

const SUGGESTED: SuggestedUser[] = [
	{ id: 201, name: "Nour A.", initials: "NA", color: "#9B6B2A", tier: "Home Cook" },
	{ id: 202, name: "Felix B.", initials: "FB", color: "#8A9E7A", tier: "Beginner" },
	{ id: 203, name: "Rita S.", initials: "RS", color: "#D9A28B", tier: "Chef" },
	{ id: 204, name: "Omar H.", initials: "OH", color: "#7A3A18", tier: "Sous Chef" },
];

const INITIAL_REQUESTS: Request[] = [
	{ id: 101, name: "Aiko T.", initials: "AT", color: colors.terracotta, mutuals: 3 },
	{ id: 102, name: "James O.", initials: "JO", color: colors.sage, mutuals: 1 },
];

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

function SectionLabel({ children }: { children: string }) {
	return <Text style={styles.sectionLabel}>{children}</Text>;
}

function ProfileDetails({ friend }: { friend: Friend }) {
	return (
		<View style={styles.profileDetails}>
			<View style={styles.statsRow}>
				{[{ label: "Recipes", value: friend.recipes }, { label: "Level", value: friend.level }, { label: "Streak", value: `${friend.streak}🔥` }].map((stat) => (
					<View key={stat.label} style={styles.statBox}><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text></View>
				))}
			</View>
			<Text style={styles.recentLabel}>Recent cooks</Text>
			<View style={styles.recentRow}>{friend.recentImgs.map((src, index) => <Image key={index} source={{ uri: src }} style={styles.recentImage} />)}</View>
		</View>
	);
}

export default function SocialScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
	const [requests, setRequests] = useState(INITIAL_REQUESTS);
	const [openProfile, setOpenProfile] = useState<number | null>(null);
	const [showLeaderboard, setShowLeaderboard] = useState(false);

	const searchResults = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return query ? SUGGESTED.filter((user) => user.name.toLowerCase().includes(query)) : null;
	}, [searchQuery]);
	const leaderboard = [FRIENDS[2], FRIENDS[0], FRIENDS[4]];
	const podium = [leaderboard[1], leaderboard[0], leaderboard[2]];
	const rankLabels = ["🥇", "🥈", "🥉"];

	return (
		<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
			<View style={styles.header}>
				<Text style={styles.eyebrow}>Your crew</Text>
				<Text style={styles.title}>Social</Text>
				<Text style={styles.subtitle}>Add friends, manage requests, and check in with your people.</Text>
			</View>

			<View style={[styles.panel, shadowSm]}>
				<View style={styles.panelHeader}><View style={styles.headingRow}><Text style={styles.headingIcon}>🏆</Text><Text style={styles.heading}>Top 3 this week</Text></View><Pressable onPress={() => setShowLeaderboard((value) => !value)}><Text style={styles.link}>{showLeaderboard ? "Hide" : "See full leaderboard"} →</Text></Pressable></View>
				<View style={styles.podiumRow}>{podium.map((friend, index) => <View key={friend.id} style={[styles.podiumEntry, index !== 1 && styles.podiumLower]}><Text style={styles.rank}>{rankLabels[friend.id === 3 ? 0 : friend.id === 1 ? 1 : 2]}</Text><Avatar friend={friend} size={index === 1 ? 56 : 40} /><Text style={styles.podiumName}>{friend.name.split(" ")[0]}</Text><Text style={styles.points}>{friend.recipes * 4} pts</Text><View style={[styles.podiumBlock, index === 1 ? styles.firstBlock : index === 0 ? styles.secondBlock : styles.thirdBlock]} /></View>)}</View>
				{showLeaderboard && <View style={styles.leaderboard}>{[...FRIENDS].sort((a, b) => b.recipes - a.recipes).map((friend, index) => <View key={friend.id} style={styles.leaderRow}><Text style={styles.leaderRank}>{index + 1}</Text><Avatar friend={friend} size={32} /><Text style={styles.leaderName}>{friend.name}</Text><TierBadge tier={friend.tier} /><Text style={styles.points}>{friend.recipes * 4} pts</Text></View>)}</View>}
			</View>

			<View style={styles.section}><SectionLabel>Add friends</SectionLabel><View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users" placeholderTextColor={colors.faint} style={styles.searchInput} />{searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery("")}><Text style={styles.clear}>✕</Text></Pressable>}</View><View style={[styles.listPanel, shadowSm]}>{searchResults && searchResults.length === 0 && <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>}{(searchResults ?? SUGGESTED).map((user, index, array) => { const added = addedIds.has(user.id); return <View key={user.id} style={[styles.userRow, index < array.length - 1 && styles.rowBorder]}><View style={[styles.avatar, { backgroundColor: user.color }]}><Text style={styles.avatarText}>{user.initials}</Text></View><View style={styles.userInfo}><Text style={styles.userName}>{user.name}</Text><TierBadge tier={user.tier} /></View><Pressable onPress={() => setAddedIds((current) => new Set(current).add(user.id))} disabled={added} style={[styles.actionButton, added ? styles.sentButton : styles.addButton]}><Text style={[styles.actionText, added && styles.sentText]}>{added ? "Sent ✓" : "+ Add"}</Text></Pressable></View>})}{!searchResults && <Text style={styles.suggestedFooter}>Suggested for you</Text>}</View></View>

			<View style={styles.section}><View style={styles.sectionTitleRow}><SectionLabel>Friend requests</SectionLabel>{requests.length > 0 && <View style={styles.requestCount}><Text style={styles.requestCountText}>{requests.length}</Text></View>}</View>{requests.length === 0 ? <View style={[styles.emptyPanel, shadowSm]}><Text style={styles.emptyEmoji}>👐</Text><Text style={styles.emptyText}>No pending requests</Text></View> : <View style={[styles.listPanel, shadowSm]}>{requests.map((request, index) => <View key={request.id} style={[styles.userRow, index < requests.length - 1 && styles.rowBorder]}><View style={[styles.avatar, { backgroundColor: request.color }]}><Text style={styles.avatarText}>{request.initials}</Text></View><View style={styles.userInfo}><Text style={styles.userName}>{request.name}</Text><Text style={styles.mutuals}>{request.mutuals} mutual friend{request.mutuals !== 1 ? "s" : ""}</Text></View><Pressable onPress={() => setRequests((current) => current.filter((item) => item.id !== request.id))} style={[styles.smallAction, styles.rejectButton]}><Text style={styles.rejectText}>Reject</Text></Pressable><Pressable onPress={() => setRequests((current) => current.filter((item) => item.id !== request.id))} style={[styles.smallAction, styles.acceptButton]}><Text style={styles.acceptText}>Accept</Text></Pressable></View>)}</View>}</View>

			<View style={styles.section}><View style={styles.sectionTitleRow}><SectionLabel>Your friends</SectionLabel><Text style={styles.friendCount}>{FRIENDS.length} friends</Text></View><View style={[styles.listPanel, shadowSm]}>{FRIENDS.map((friend, index) => { const isOpen = openProfile === friend.id; return <View key={friend.id}><Pressable onPress={() => setOpenProfile(isOpen ? null : friend.id)} style={[styles.userRow, index < FRIENDS.length - 1 && !isOpen && styles.rowBorder, isOpen && styles.openRow]}><Avatar friend={friend} /><View style={styles.userInfo}><View style={styles.nameTierRow}><Text style={styles.userName}>{friend.name}</Text><TierBadge tier={friend.tier} /></View><Text style={styles.mutuals}>🔥 {friend.streak} day streak</Text></View><View style={[styles.viewButton, isOpen && styles.viewButtonOpen]}><Text style={[styles.viewText, isOpen && styles.viewTextOpen]}>{isOpen ? "Close" : "View"}</Text></View></Pressable>{isOpen && <ProfileDetails friend={friend} />}</View>})}</View></View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	fill: { width: "100%", height: "100%" },
	content: { paddingBottom: 32 },
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
	viewButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
	viewButtonOpen: { backgroundColor: colors.sageLight, borderColor: colors.sage },
	viewText: { fontSize: 10, fontWeight: "700", color: colors.muted },
	viewTextOpen: { color: colors.sage },
	profileDetails: { padding: 16, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.cream },
	statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
	statBox: { flex: 1, alignItems: "center", padding: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
	statValue: { fontSize: 14, fontWeight: "800", color: colors.ink },
	statLabel: { marginTop: 2, fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
	recentLabel: { marginBottom: 8, fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
	recentRow: { flexDirection: "row", gap: 8 },
	recentImage: { flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: colors.sageLight },
});
