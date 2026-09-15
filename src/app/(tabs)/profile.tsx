import { StyleSheet, Text, View } from "react-native";

import { useAuthContext } from "@/lib/auth/auth-context";

export default function ProfileScreen() {
	const { currentUser } = useAuthContext();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Profile</Text>
			<Text style={styles.username}>{currentUser?.username || "Your profile"}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#ffffff" },
	title: { color: "#203429", fontSize: 32, fontWeight: "800" },
	username: { color: "#738078", fontSize: 15, marginTop: 8 },
});