const Slider = require("@react-native-community/slider") as React.ComponentType<any>;
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
				<Text style={styles.value}>{value} / 5</Text>
			</View>

			<Slider
				value={value}
				minimumValue={1}
				maximumValue={5}
				step={1}
				onValueChange={onChange}
				minimumTrackTintColor="#687B5D"
				maximumTrackTintColor="#d9dfd6"
				thumbTintColor="#687B5D"
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
});
