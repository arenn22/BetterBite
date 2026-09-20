import { StyleSheet, Text, View } from "react-native";

interface DifficultySliderProps {
	value: number;
	onChange: (value: number) => void;
}

export default function DifficultySlider({
	value,
	onChange,
}: DifficultySliderProps) {
	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
				<Text style={styles.label}>Difficulty</Text>
				<Text style={styles.value}>{value} / 10</Text>
			</View>

			<input
				aria-label="Difficulty"
				 type="range"
				min={1}
				max={10}
				step={1}
				value={value}
				onChange={(event) => onChange(Number(event.currentTarget.value))}
				style={styles.input}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 18,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		color: "#687B5D",
		fontWeight: "600",
	},
	value: {
		fontSize: 14,
		color: "#1f2a1f",
		fontWeight: "700",
	},
	input: {
		width: "100%",
	},
});