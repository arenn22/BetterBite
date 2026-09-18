import { Image, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/app-theme";

import { BaseCard } from "./base-card";

export type PostCardProps = {
	username: string;
	initials: string;
	profilePictureUrl?: string | null;
	meal: string;
	description: string;
	imageUrl: string;
	timeAgo: string;
	tag: string;
	compact?: boolean;
};

export function PostCard({
	username,
	initials,
	profilePictureUrl,
	meal,
	description,
	imageUrl,
	timeAgo,
	tag,
	compact = false,
}: PostCardProps) {
	return (
		<BaseCard style={styles.card}>
			<Image
				source={{ uri: imageUrl }}
				style={[styles.image, compact && styles.compactImage]}
			/>
			<View
				style={[styles.postContent, compact && styles.compactContent]}
			>
				<View style={styles.authorRow}>
					{profilePictureUrl ? (
						<Image
							accessibilityLabel={`${username}'s profile picture`}
							source={{ uri: profilePictureUrl }}
							style={styles.avatar}
						/>
					) : (
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{initials}</Text>
						</View>
					)}
					<View style={styles.authorDetails}>
						<Text style={styles.username}>{username}</Text>
						<Text style={styles.time}>{timeAgo}</Text>
					</View>
					<View style={[styles.tag, compact && styles.compactTag]}>
						<Text style={styles.tagText}>{tag}</Text>
					</View>
				</View>
				<Text
					style={[styles.meal, compact && styles.compactMeal]}
					numberOfLines={2}
				>
					{meal}
				</Text>
				<Text style={styles.description} numberOfLines={2}>
					{description}
				</Text>
			</View>
		</BaseCard>
	);
}

const styles = StyleSheet.create({
	card: {
		width: "100%",
		maxWidth: 540,
	},
	image: {
		width: "100%",
		height: 154,
		backgroundColor: AppTheme.accentSoft,
	},
	compactImage: { height: 104 },
	postContent: {
		padding: 16,
	},
	compactContent: { padding: 12 },
	authorRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppTheme.warmSoft,
	},
	avatarText: {
		color: AppTheme.warm,
		fontSize: 11,
		fontWeight: "800",
	},
	authorDetails: {
		marginLeft: 9,
		flex: 1,
	},
	username: {
		color: AppTheme.text,
		fontSize: 13,
		fontWeight: "700",
	},
	time: {
		color: AppTheme.muted,
		fontSize: 11,
		marginTop: 2,
	},
	tag: {
		backgroundColor: AppTheme.accentSoft,
		borderRadius: 8,
		paddingHorizontal: 9,
		paddingVertical: 5,
	},
	compactTag: {
		paddingHorizontal: 7,
		paddingVertical: 4,
	},
	tagText: {
		color: AppTheme.accent,
		fontSize: 10,
		fontWeight: "700",
	},
	meal: {
		color: AppTheme.text,
		fontSize: 18,
		fontWeight: "600",
		marginTop: 14,
	},
	compactMeal: { fontSize: 15, marginTop: 10 },
	description: {
		color: AppTheme.muted,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 5,
	},
});
