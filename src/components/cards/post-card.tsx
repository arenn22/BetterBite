import { Image, StyleSheet, Text, View } from "react-native";

import { BaseCard } from "./base-card";

export type PostCardProps = {
	username: string;
	initials: string;
	meal: string;
	description: string;
	imageUrl: string;
	timeAgo: string;
	tag: string;
};

export function PostCard({
	username,
	initials,
	meal,
	description,
	imageUrl,
	timeAgo,
	tag,
}: PostCardProps) {
	return (
		<BaseCard>
			<Image source={{ uri: imageUrl }} style={styles.image} />
			<View style={styles.postContent}>
				<View style={styles.authorRow}>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>{initials}</Text>
					</View>
					<View style={styles.authorDetails}>
						<Text style={styles.username}>{username}</Text>
						<Text style={styles.time}>{timeAgo}</Text>
					</View>
					<View style={styles.tag}>
						<Text style={styles.tagText}>{tag}</Text>
					</View>
				</View>
				<Text style={styles.meal}>{meal}</Text>
				<Text style={styles.description} numberOfLines={2}>
					{description}
				</Text>
			</View>
		</BaseCard>
	);
}

const styles = StyleSheet.create({
	image: {
		width: "100%",
		height: 154,
		backgroundColor: "#DDE8D8",
	},
	postContent: {
		padding: 16,
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
		backgroundColor: "#E1B866",
	},
	avatarText: {
		color: "#3B3424",
		fontSize: 11,
		fontWeight: "800",
	},
	authorDetails: {
		marginLeft: 9,
		flex: 1,
	},
	username: {
		color: "#25372B",
		fontSize: 13,
		fontWeight: "700",
	},
	time: {
		color: "#849087",
		fontSize: 11,
		marginTop: 2,
	},
	tag: {
		backgroundColor: "#EEF4EC",
		borderRadius: 8,
		paddingHorizontal: 9,
		paddingVertical: 5,
	},
	tagText: {
		color: "#55735A",
		fontSize: 10,
		fontWeight: "700",
	},
	meal: {
		color: "#1D3025",
		fontSize: 18,
		fontWeight: "800",
		marginTop: 14,
	},
	description: {
		color: "#68766C",
		fontSize: 13,
		lineHeight: 19,
		marginTop: 5,
	},
});