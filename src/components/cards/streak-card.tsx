import { StyleSheet, Text, View } from "react-native";

import { BaseCard } from "./base-card";

export type StreakCardProps = {
	days: number;
	note: string;
};

export function StreakCard({ days, note }: StreakCardProps) {
	return (
		<BaseCard style={styles.card} contentStyle={styles.content}>
			<View style={styles.copy}>
				<Text style={styles.kicker}>CURRENT STREAK</Text>
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
				<Text style={styles.keepGoing}>KEEP GOING</Text>
			</View>
		</BaseCard>
	);
}

const styles = StyleSheet.create({
	card: {
		minHeight: 142,
		backgroundColor: "#254C3A",
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
		color: "#B9D1A8",
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
		color: "#FFFFFF",
		fontSize: 52,
		lineHeight: 58,
		fontWeight: "800",
		letterSpacing: -2,
	},
	days: {
		color: "#DDE9D5",
		fontSize: 17,
		fontWeight: "700",
		marginLeft: 7,
	},
	note: {
		color: "#B9D1A8",
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
		borderColor: "#E6BC61",
		alignItems: "center",
		justifyContent: "center",
		transform: [{ rotate: "-20deg" }],
	},
	mark: {
		color: "#E6BC61",
		fontSize: 30,
		fontWeight: "300",
		transform: [{ rotate: "20deg" }],
	},
	keepGoing: {
		color: "#E6BC61",
		fontSize: 9,
		fontWeight: "800",
		letterSpacing: 1,
		marginTop: 8,
	},
});