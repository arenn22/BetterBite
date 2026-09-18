import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/app-theme";

import { BaseCard } from "./base-card";

export type StreakCardProps = {
	days: number;
	note: string;
};

export function StreakCard({ days, note }: StreakCardProps) {
	return (
		<BaseCard style={styles.card} contentStyle={styles.content}>
			<View style={styles.copy}>
				<Text style={styles.kicker}>Current streak</Text>
				<View style={styles.numberRow}>
					<Text style={styles.number}>{days}</Text>
					<Text style={styles.days}>days</Text>
				</View>
				<Text style={styles.note}>{note}</Text>
			</View>
			<View style={styles.visual}>
				<View style={styles.ring}>
					<Text style={styles.mark}>+</Text>
				</View>
				<Text style={styles.keepGoing}>Keep going</Text>
			</View>
		</BaseCard>
	);
}

const styles = StyleSheet.create({
	card: {
		minHeight: 142,
		backgroundColor: AppTheme.accentSoft,
	},
	content: {
		padding: 21,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	copy: {
		justifyContent: "center",
	},
	kicker: {
		color: AppTheme.accent,
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.4,
	},
	numberRow: {
		flexDirection: "row",
		alignItems: "baseline",
		marginTop: 3,
	},
	number: {
		color: AppTheme.text,
		fontSize: 52,
		lineHeight: 58,
		fontWeight: "800",
		letterSpacing: -2,
	},
	days: {
		color: AppTheme.accent,
		fontSize: 17,
		fontWeight: "700",
		marginLeft: 7,
	},
	note: {
		color: AppTheme.muted,
		fontSize: 12,
		marginTop: 2,
	},
	visual: {
		alignItems: "center",
		justifyContent: "center",
		width: 100,
	},
	ring: {
		width: 67,
		height: 67,
		borderRadius: 34,
		borderWidth: 7,
		borderColor: AppTheme.warm,
		alignItems: "center",
		justifyContent: "center",
		transform: [{ rotate: "-20deg" }],
	},
	mark: {
		color: AppTheme.warm,
		fontSize: 30,
		fontWeight: "300",
		transform: [{ rotate: "20deg" }],
	},
	keepGoing: {
		color: AppTheme.warm,
		fontSize: 9,
		fontWeight: "800",
		letterSpacing: 1,
		marginTop: 8,
	},
});
