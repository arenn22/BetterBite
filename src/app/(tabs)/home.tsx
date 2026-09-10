import { useAuthContext } from "@/lib/auth/auth-context";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
	const { currentUser } = useAuthContext();

	const joinedDate = currentUser?.date_joined
		? new Date(currentUser.date_joined).toLocaleDateString()
		: "N/A";

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Home</Text>

			{currentUser ? (
				<View style={styles.card}>
					<Text style={styles.label}>Username</Text>
					<Text style={styles.value}>{currentUser.username}</Text>

					<Text style={styles.label}>Email</Text>
					<Text style={styles.value}>{currentUser.email}</Text>

					<Text style={styles.label}>User ID</Text>
					<Text style={styles.value}>{currentUser.id}</Text>

					<Text style={styles.label}>Date Joined</Text>
					<Text style={styles.value}>{joinedDate}</Text>
				</View>
			) : (
				<Text style={styles.empty}>No profile loaded.</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
		backgroundColor: "#f7f7f5",
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		marginBottom: 24,
		color: "#1f2a1f",
	},
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 20,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
	label: {
		fontSize: 14,
		color: "#687B5D",
		marginTop: 16,
		fontWeight: "600",
	},
	value: {
		fontSize: 18,
		color: "#1f2a1f",
		marginTop: 6,
	},
	empty: {
		fontSize: 18,
		color: "#555",
	},
});
