import { StyleSheet, Text, View } from "react-native";

export default function ExploreScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Explore</Text>
			<Text style={styles.subtitle}>Find recipes and inspiration from the community.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#ffffff" },
	title: { color: "#203429", fontSize: 32, fontWeight: "800" },
	subtitle: { color: "#738078", fontSize: 15, marginTop: 8 },
});