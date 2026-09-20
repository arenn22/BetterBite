import DifficultySlider from "@/components/difficulty-slider";
import { AppTheme } from "@/constants/app-theme";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
    fetchUserProfile,
    set_my_dietary_restrictions,
    set_my_experience_level,
    updateProfilePhoto,
} from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function normalizeNumberArray(value: unknown): number[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value
			.map((item) => Number(item))
			.filter((item) => Number.isFinite(item));
	}
	if (typeof value === "string") {
		return value
			.split(",")
			.map((item) => Number(item.trim()))
			.filter((item) => Number.isFinite(item));
	}
	return [];
}

function normalizeExperienceLevel(value: unknown): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 2;
	return Math.min(5, Math.max(1, Math.round(parsed)));
}

export default function SettingsScreen() {
	const router = useRouter();
	const { currentUser, refreshCurrentUser, signOut } = useAuthContext();
	const { dietaryOptions, loading: loadingOptions } = useRecipeOptions();
	const [selectedRestrictionIds, setSelectedRestrictionIds] = useState<number[]>([]);
	const [experienceLevel, setExperienceLevel] = useState(2);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [loading, setLoading] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [signingOut, setSigningOut] = useState(false);

	useEffect(() => {
		if (!currentUser) return;
		let active = true;

		async function loadSettings() {
			try {
				const profile = await fetchUserProfile(currentUser.id);
				if (!active) return;
				const profileExtras = profile as typeof profile & {
					experience_level?: number | null;
					experienceLevel?: number | null;
					dietary_restrictions?: number[] | null;
					dietaryRestrictions?: number[] | null;
				};

				setSelectedRestrictionIds(
					normalizeNumberArray(
						profileExtras?.dietary_restrictions ?? profileExtras?.dietaryRestrictions,
					),
				);
				setExperienceLevel(
					normalizeExperienceLevel(
						profileExtras?.experience_level ?? profileExtras?.experienceLevel,
					),
				);
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

	function toggleCollection(id: number, setter: React.Dispatch<React.SetStateAction<number[]>>) {
		setter((current) =>
			current.includes(id)
				? current.filter((value) => value !== id)
				: [...current, id],
		);
	}

	async function pickProfilePhoto() {
		if (!currentUser) return;

		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert("Permission required", "Allow photo access to update your profile picture.");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (result.canceled || !result.assets[0]?.uri) return;

		setUploadingPhoto(true);
		try {
			const publicUrl = await updateProfilePhoto(currentUser.id, result.assets[0].uri);
			await refreshCurrentUser();
			Alert.alert("Profile photo updated", "Your new photo has been saved.");
			console.log("Updated profile photo URL:", publicUrl);
		} catch (error) {
			Alert.alert(
				"Upload failed",
				error instanceof Error ? error.message : "Your profile photo could not be uploaded.",
			);
		} finally {
			setUploadingPhoto(false);
		}
	}

	async function saveProfilePreferences() {
		if (!currentUser) return;
		setSavingProfile(true);
		try {
			await Promise.all([
				set_my_dietary_restrictions(selectedRestrictionIds),
				set_my_experience_level(experienceLevel),
			]);
			await refreshCurrentUser();
			Alert.alert("Profile updated", "Your experience and dietary preferences were saved.");
		} catch {
			Alert.alert(
				"Could not save profile settings",
				"Please check your account permissions and try again.",
			);
		} finally {
			setSavingProfile(false);
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
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Text style={styles.backText}>Back</Text>
				</Pressable>
				<Text style={styles.eyebrow}>Your account</Text>
				<Text style={styles.title}>Settings</Text>
				<Text style={styles.subtitle}>Tune the recipes and the kitchen experience you want to see.</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Profile photo</Text>
					<Text style={styles.sectionHint}>Choose a photo to show up across the app.</Text>
					<View style={styles.profileRow}>
						<Image
							source={{ uri: currentUser.pfp_url?.trim() || undefined }}
							style={styles.profileImage}
						/>
						<Pressable
							disabled={uploadingPhoto}
							onPress={pickProfilePhoto}
							style={[styles.photoButton, uploadingPhoto && styles.disabled]}
						>
							<Text style={styles.photoButtonText}>
								{uploadingPhoto ? "Uploading..." : "Upload photo"}
							</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Experience level</Text>
					<Text style={styles.sectionHint}>Set the difficulty range you want in your feed.</Text>
					{loading ? (
						<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
					) : (
						<DifficultySlider value={experienceLevel} onChange={setExperienceLevel} />
					)}
					<Pressable
						disabled={loading || savingProfile}
						onPress={saveProfilePreferences}
						style={[styles.saveButton, (loading || savingProfile) && styles.disabled]}
					>
						<Text style={styles.saveText}>{savingProfile ? "Saving..." : "Save profile"}</Text>
					</Pressable>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Dietary restrictions</Text>
					<Text style={styles.sectionHint}>Choose the tags that fit your eating preferences.</Text>
					{loadingOptions ? (
						<ActivityIndicator color={AppTheme.accent} style={styles.loading} />
					) : (
						<View style={styles.options}>
							{dietaryOptions.map((option) => {
								const selected = selectedRestrictionIds.includes(option.id);
								return (
									<Pressable
										key={option.id}
										onPress={() => toggleCollection(option.id, setSelectedRestrictionIds)}
										style={[styles.option, selected && styles.selectedOption]}
									>
										<Text style={[styles.optionText, selected && styles.selectedOptionText]}>
											{option.name}
										</Text>
									</Pressable>
								);
							})}
						</View>
					)}
					<Pressable
						disabled={loadingOptions || savingProfile}
						onPress={saveProfilePreferences}
						style={[styles.saveButton, (loadingOptions || savingProfile) && styles.disabled]}
					>
						<Text style={styles.saveText}>{savingProfile ? "Saving..." : "Save dietary choices"}</Text>
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
	content: { padding: 20, paddingBottom: 48 },
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
	profileRow: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 16 },
	profileImage: { width: 72, height: 72, borderRadius: 36, backgroundColor: AppTheme.accentSoft },
	photoButton: {
		backgroundColor: AppTheme.accent,
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	photoButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
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
