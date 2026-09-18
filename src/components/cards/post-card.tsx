import { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

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
	difficulty?: number;
	recipe?: Record<string, unknown>;
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
	difficulty = 1,
	recipe,
}: PostCardProps) {
	const [detailsVisible, setDetailsVisible] = useState(false);
	const [imageFailed, setImageFailed] = useState(false);
	const [authorImageFailed, setAuthorImageFailed] = useState(false);
	const ingredients = getRecipeList(recipe?.ingredients);
	const steps = getRecipeList(recipe?.steps);
	const hasImage = Boolean(imageUrl?.trim()) && !imageFailed;
	const hasAuthorImage = Boolean(profilePictureUrl?.trim()) && !authorImageFailed;

	return (
		<>
			<Pressable onPress={() => setDetailsVisible(true)}>
				<BaseCard style={styles.card}>
					{hasImage ? (
						<Image
							source={{ uri: imageUrl }}
							style={styles.image}
								resizeMode="cover"
								onError={() => setImageFailed(true)}
						/>
					) : (
						<View style={styles.imageFallback}>
							<Text style={styles.imageFallbackMark}>BB</Text>
							<Text style={styles.imageFallbackText}>Recipe image unavailable</Text>
						</View>
					)}
					<View style={styles.postContent}>
				<View style={styles.authorRow}>
					{hasAuthorImage ? (
						<Image
							accessibilityLabel={`${username}'s profile picture`}
							source={{ uri: profilePictureUrl }}
							style={styles.avatar}
							resizeMode="cover"
							onError={() => setAuthorImageFailed(true)}
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
					<View style={styles.tag}>
						<Text style={styles.tagText}>{tag}</Text>
					</View>
				</View>
				<Text style={styles.meal} numberOfLines={2}>
					{meal}
				</Text>
				<Text style={styles.description} numberOfLines={2}>
					{description}
				</Text>
					</View>
				</BaseCard>
			</Pressable>
			<Modal
				visible={detailsVisible}
				animationType="slide"
				onRequestClose={() => setDetailsVisible(false)}
			>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<ScrollView showsVerticalScrollIndicator={false}>
							<Pressable
								style={styles.closeButton}
								onPress={() => setDetailsVisible(false)}
							>
								<Text style={styles.closeText}>Close</Text>
							</Pressable>
							<Text style={styles.modalTitle}>{meal}</Text>
							<Text style={styles.modalMeta}>
								{username}  |  Difficulty {difficulty}/5
							</Text>
							<Text style={styles.modalDescription}>{description}</Text>
							<Text style={styles.detailHeading}>Ingredients</Text>
							{ingredients.length ? ingredients.map((item, index) => (
								<Text style={styles.detailItem} key={`${item}-${index}`}>
									- {item}
								</Text>
							)) : <Text style={styles.detailEmpty}>No ingredients listed.</Text>}
							<Text style={styles.detailHeading}>How to cook</Text>
							{steps.length ? steps.map((item, index) => (
								<Text style={styles.detailItem} key={`${item}-${index}`}>
									{index + 1}. {item}
								</Text>
							)) : <Text style={styles.detailEmpty}>No cooking steps listed.</Text>}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</>
	);
}

function getRecipeList(value: unknown) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => String(item)).filter(Boolean);
}

const styles = StyleSheet.create({
	card: {
		width: "100%",
		maxWidth: 600,
	},
	image: {
		width: "100%",
		height: 300,
		backgroundColor: AppTheme.accentSoft,
	},
	imageFallback: {
		height: 300,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	imageFallbackMark: { color: AppTheme.accent, fontSize: 30, fontWeight: "700" },
	imageFallbackText: { color: AppTheme.muted, fontSize: 12, marginTop: 6 },
	postContent: {
		padding: 20,
	},
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
	tagText: {
		color: AppTheme.accent,
		fontSize: 10,
		fontWeight: "700",
	},
	meal: {
		color: AppTheme.text,
		fontSize: 24,
		fontWeight: "600",
		marginTop: 16,
	},
	description: {
		color: AppTheme.muted,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 5,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(48, 49, 46, 0.45)",
		justifyContent: "flex-end",
	},
	modalCard: {
		maxHeight: "88%",
		backgroundColor: AppTheme.background,
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		padding: 24,
	},
	closeButton: { alignSelf: "flex-end", paddingVertical: 4, paddingHorizontal: 2 },
	closeText: { color: AppTheme.accent, fontSize: 14, fontWeight: "700" },
	modalTitle: { color: AppTheme.text, fontSize: 28, fontWeight: "700", marginTop: 12 },
	modalMeta: { color: AppTheme.accent, fontSize: 13, fontWeight: "600", marginTop: 8 },
	modalDescription: { color: AppTheme.muted, fontSize: 15, lineHeight: 23, marginTop: 18 },
	detailHeading: { color: AppTheme.text, fontSize: 18, fontWeight: "700", marginTop: 26, marginBottom: 10 },
	detailItem: { color: AppTheme.text, fontSize: 15, lineHeight: 23, marginBottom: 7 },
	detailEmpty: { color: AppTheme.muted, fontSize: 14 },
});
