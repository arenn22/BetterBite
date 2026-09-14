import { StyleSheet, Text, View } from "react-native";

import { BaseCard } from "./base-card";

export type ChallengeCardProps = {
	title: string;
	detail: string;
	progress: number;
	total: number;
	color: string;
};

export function ChallengeCard({ title, detail, progress, total, color }: ChallengeCardProps) {
	const percentage = Math.round((progress / total) * 100);

	return (
		<BaseCard style={styles.card} contentStyle={styles.content}>
			<View style={[styles.icon, { backgroundColor: color }]}>
				<Text style={styles.iconText}>{progress === total ? "OK" : "GO"}</Text>
			</View>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.detail}>{detail}</Text>
			<View style={styles.progressTrack}>
				<View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
			</View>
			<Text style={styles.progressLabel}>{progress} of {total} complete</Text>
		</BaseCard>
	);
}

const styles = StyleSheet.create({
	card: {
		width: 178,
		minHeight: 190,
	},
	content: {
		padding: 16,
	},
	icon: {
		width: 38,
		height: 38,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 15,
	},
	iconText: {
		color: "#FFFFFF",
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	title: {
		color: "#25372B",
		fontSize: 15,
		fontWeight: "800",
	},
	detail: {
		color: "#7B877F",
		fontSize: 12,
		lineHeight: 17,
		marginTop: 4,
		height: 34,
	},
	progressTrack: {
		height: 7,
		borderRadius: 4,
		backgroundColor: "#EEF1EC",
		overflow: "hidden",
		marginTop: 15,
	},
	progressFill: {
		height: "100%",
		borderRadius: 4,
	},
	progressLabel: {
		color: "#849087",
		fontSize: 10,
		fontWeight: "600",
		marginTop: 7,
	},
});