import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTheme } from "@/constants/app-theme";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
    fetchCuisines,
    fetchUserProfile,
    updateCuisinePreferences,
} from "@/services/api";

export default function SettingsScreen() {
	const router = useRouter();
	const { currentUser, signOut } = useAuthContext();
	const [cuisines, setCuisines] = useState<{ id: number; name: string }[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>(
		currentUser?.cuisine_preferences || [],
	);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [signingOut, setSigningOut] = useState(false);

	useEffect(() => {
		if (!currentUser) return;
		let active = true;
		async function loadSettings() {
			try {
				const [cuisineOptions, profile] = await Promise.all([
					fetchCuisines(),
					fetchUserProfile(currentUser.id),
				]);
				if (!active) return;
				setCuisines(cuisineOptions);
				setSelectedIds(profile?.cuisine_preferences || []);
			} catch {
				if (active) Alert.alert("Unable to load settings", "Please try again.");
			} finally {
				if (active) setLoading(false);
			}
		}
		void loadSettings();
		return () => {
			active = false;
		};
	}, [currentUser]);

	function toggleCuisine(id: number) {
		setSelectedIds((current) =>
			current.includes(id)
				? current.filter((cuisineId) => cuisineId !== id)
				: [...current, id],
		);
	}

	async function savePreferences() {
		if (!currentUser) return;
		setSaving(true);
		try {
			await updateCuisinePreferences(currentUser.id, selectedIds);
			Alert.alert("Preferences saved", "Your cuisine preferences are up to date.");
		} catch {
			Alert.alert(
				"Could not save preferences",
				"Add the cuisine_preferences field to profiles before saving preferences.",
			);
		} finally {
			setSaving(false);
		}
	}

	async function logOut() {
		setSigningOut(true);
		try {
			await signOut();
			router.replace("/(auth)/signup");
		} finally {
			setSigningOut(false);
		}
	}

	if (!currentUser) return null;

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Text style={styles.backText}>Back</Text>
				</Pressable>
				<Text style={styles.eyebrow}>Your account</Text>
				<Text style={styles.title}>Settings</Text>
				<Text style={styles.subtitle}>
					Choose the flavors you want to see more often.
				</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Cuisine preferences</Text>
					<Text style={styles.sectionHint}>Select all that sound good.</Text>
					{loading ? (
						<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
					) : (
						<View style={styles.options}>
							{cuisines.map((cuisine) => {
								const selected = selectedIds.includes(cuisine.id);
								return (
									<Pressable
										key={cuisine.id}
										onPress={() => toggleCuisine(cuisine.id)}
										style={[styles.option, selected && styles.selectedOption]}
									>
										<Text style={[styles.optionText, selected && styles.selectedOptionText]}>
											{cuisine.name}
										</Text>
									</Pressable>
								);
							})}
						</View>
					)}
					<Pressable
						disabled={loading || saving}
						onPress={savePreferences}
						style={[styles.saveButton, (loading || saving) && styles.disabled]}
					>
						<Text style={styles.saveText}>{saving ? "Saving..." : "Save preferences"}</Text>
					</Pressable>
				</View>

				<Pressable
					disabled={signingOut}
					onPress={logOut}
					style={[styles.logoutButton, signingOut && styles.disabled]}
				>
					<Text style={styles.logoutText}>{signingOut ? "Logging out..." : "Log out"}</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: AppTheme.background },
	content: { padding: 20, paddingBottom: 40 },
	backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingRight: 12 },
	backText: { color: AppTheme.accent, fontSize: 14, fontWeight: "700" },
	eyebrow: { color: AppTheme.muted, fontSize: 13, marginTop: 22 },
	title: { color: AppTheme.text, fontSize: 32, fontWeight: "600", marginTop: 6 },
	subtitle: { color: AppTheme.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
	section: {
		backgroundColor: AppTheme.surface,
		borderColor: AppTheme.border,
		borderRadius: 12,
		borderWidth: 1,
		marginTop: 28,
		padding: 18,
	},
	sectionTitle: { color: AppTheme.text, fontSize: 18, fontWeight: "700" },
	sectionHint: { color: AppTheme.muted, fontSize: 13, marginTop: 5 },
	loading: { marginVertical: 24 },
	options: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
	option: {
		borderColor: AppTheme.border,
		borderRadius: 9,
		borderWidth: 1,
		paddingHorizontal: 13,
		paddingVertical: 10,
	},
	selectedOption: { backgroundColor: AppTheme.accent, borderColor: AppTheme.accent },
	optionText: { color: AppTheme.muted, fontSize: 13 },
	selectedOptionText: { color: "#FFFFFF", fontWeight: "700" },
	saveButton: {
		alignItems: "center",
		backgroundColor: AppTheme.accent,
		borderRadius: 9,
		marginTop: 22,
		paddingVertical: 13,
	},
	saveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
	logoutButton: {
		alignItems: "center",
		borderColor: "#C96B5B",
		borderRadius: 9,
		borderWidth: 1,
		marginTop: 18,
		paddingVertical: 13,
	},
	logoutText: { color: "#B65345", fontSize: 14, fontWeight: "700" },
	disabled: { opacity: 0.55 },
});
