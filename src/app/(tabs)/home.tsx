import { useAuthContext } from "@/lib/auth/auth-context";
import { createPost } from "@/services/api";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
	const { currentUser } = useAuthContext();
	const [loading, setLoading] = useState(false); // 2. Add loading state for testing

	const joinedDate = currentUser?.date_joined
		? new Date(currentUser.date_joined).toLocaleDateString()
		: "N/A";

	// 3. Test wrapper function
	const handleTestCreatePost = async () => {
		if (!currentUser) {
			Alert.alert("Error", "You must be logged in to create a post.");
			return;
		}

		setLoading(true);

		const mockPostData = {
			title: "Test Avocado Toast",
			description: "A quick test recipe to check database function and RLS.",
			difficulty: 1,
			imageUrl: "https://unsplash.com",
			authorUsername: currentUser.username || "anonymous", 
			recipeJson: {
				prep_time: "5m",
				cook_time: "0m",
				ingredients: ["1 slice of bread", "1 avocado", "salt", "pepper"],
			},
			restrictionIds: [1, 2], // Fix: Passing actual test numeric IDs
			cuisineIds: [1, 2],        // Fix: Passing actual test numeric IDs
		};


		try {
			const newPostUuid = await createPost(mockPostData);
			Alert.alert("Success 🎉", `Post created into Supabase!\n\nID: ${newPostUuid}`);
		} catch (error: any) {
			Alert.alert("Insert Failed ❌", error.message || "Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

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

					{/* 4. Interactive Test Button */}
					<TouchableOpacity 
						style={[styles.button, loading && styles.buttonDisabled]} 
						onPress={handleTestCreatePost}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>Test Create Recipe Post</Text>
						)}
					</TouchableOpacity>
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
	// 5. Stylings added for the test button to match your theme
	button: {
		backgroundColor: "#687B5D",
		paddingVertical: 14,
		borderRadius: 12,
		marginTop: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonDisabled: {
		backgroundColor: "#a3b29a",
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
});
