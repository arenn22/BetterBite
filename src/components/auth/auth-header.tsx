import { StyleSheet, Text, View } from "react-native";

export default function AuthHeader() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>BetterBite</Text>
			<Text style={styles.subtitle}>Cook smarter. Waste less.</Text>
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginBottom: 30,
	},

	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#30312E",
	},

	subtitle: {
		marginTop: 10,
		fontSize: 15,
		color: "#85877D",
	},
});
