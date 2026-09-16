import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthContext } from "@/lib/auth/auth-context";
import { fetchUserProfile } from "@/services/api";

function formatProfileValue(value: unknown) {
	if (value === null || value === undefined || value === "") {
		return "Not provided";
	}

	if (value instanceof Date) {
		return value.toLocaleDateString();
	}

	return String(value);
}

export default function ProfileScreen() {
	const { currentUser } = useAuthContext();
	const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchUserProfile>>>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!currentUser) {
			setProfile(null);
			return;
		}

		let isActive = true;
		setLoading(true);

		fetchUserProfile(currentUser.id)
			.then(fetchedProfile => {
				if (isActive) {
					setProfile(fetchedProfile);
				}
			})
			.finally(() => {
				if (isActive) {
					setLoading(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [currentUser]);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Profile</Text>
			{loading ? (
				<ActivityIndicator color="#203429" style={styles.loading} />
			) : profile ? (
				<View style={styles.details}>
					{Object.entries(profile).map(([key, value]) => (
						<View key={key} style={styles.row}>
							<Text style={styles.label}>{key.replaceAll("_", " ")}</Text>
							<Text style={styles.value}>{formatProfileValue(value)}</Text>
						</View>
					))}
				</View>
			) : (
				<Text style={styles.message}>
					{currentUser ? "No profile data found." : "Sign in to view your profile."}
				</Text>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flexGrow: 1, padding: 24, backgroundColor: "#ffffff" },
	title: { color: "#203429", fontSize: 32, fontWeight: "800" },
	loading: { marginTop: 24 },
	details: { marginTop: 24 },
	row: {
		borderBottomColor: "#e4e9e5",
		borderBottomWidth: 1,
		paddingVertical: 16,
	},
	label: { color: "#738078", fontSize: 13, textTransform: "capitalize" },
	value: { color: "#203429", fontSize: 16, marginTop: 6 },
	message: { color: "#738078", fontSize: 15, marginTop: 16 },
});