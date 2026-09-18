import DifficultySlider from "@/components/difficulty-slider";
import { TabHeader } from "@/components/tab-header";
import { AppTheme } from "@/constants/app-theme";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
import { useAuthContext } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { createPost } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function parseList(value: string) {
	return value
		.split(/\r?\n/)
		.map((line) => line.replace(/^\d+[.)-]\s*/, "").trim())
		.filter(Boolean);
}

export default function CreateScreen() {
	const { currentUser, refreshCurrentUser } = useAuthContext();
	const {
		dietaryOptions,
		cuisineOptions,
		loading: loadingOptions,
	} = useRecipeOptions();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [ingredients, setIngredients] = useState("");
	const [steps, setSteps] = useState("");
	const [difficulty, setDifficulty] = useState(2);
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [restrictions, setRestrictions] = useState<number[]>([]);
	const [cuisines, setCuisines] = useState<number[]>([]);
	const [publishing, setPublishing] = useState(false);

	async function chooseImage() {
		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Permission required",
				"Allow photo access to add a recipe image.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]?.uri)
			setImageUri(result.assets[0].uri);
	}

	async function publish() {
		if (!currentUser) return;
		const parsedIngredients = parseList(ingredients);
		const parsedSteps = parseList(steps);
		if (
			!title.trim() ||
			!description.trim() ||
			!imageUri ||
			!parsedIngredients.length ||
			!parsedSteps.length
		) {
			Alert.alert(
				"Missing details",
				"Add a title, description, image, ingredients, and steps before publishing.",
			);
			return;
		}
		setPublishing(true);
		try {
			const filename = imageUri.split("/").pop() || `${Date.now()}.jpg`;
			const path = `${currentUser.id}/${Date.now()}-${filename}`;
			const blob = await (await fetch(imageUri)).blob();
			const upload = await supabase.storage
				.from("post-images")
				.upload(path, blob, {
					contentType: blob.type || "image/jpeg",
					upsert: true,
				});
			if (upload.error) throw upload.error;
			await createPost({
				title: title.trim(),
				description: description.trim(),
				difficulty,
				imageUrl: path,
				authorUsername: currentUser.username,
				recipeJson: {
					ingredients: parsedIngredients,
					steps: parsedSteps,
				},
				restrictionIds: restrictions,
				cuisineIds: cuisines,
			});
			await refreshCurrentUser();
			setTitle("");
			setDescription("");
			setIngredients("");
			setSteps("");
			setDifficulty(2);
			setImageUri(null);
			setRestrictions([]);
			setCuisines([]);
			Alert.alert(
				"Published",
				"Your recipe is now part of the BetterBite community.",
			);
		} catch (error) {
			Alert.alert(
				"Publish failed",
				error instanceof Error
					? error.message
					: "Your recipe could not be published.",
			);
		} finally {
			setPublishing(false);
		}
	}

	function toggle(
		value: number,
		setter: React.Dispatch<React.SetStateAction<number[]>>,
	) {
		setter((current) =>
			current.includes(value)
				? current.filter((item) => item !== value)
				: [...current, value],
		);
	}
	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<TabHeader
					eyebrow="Share the table"
					title="Create a recipe"
					subtitle="Turn something you love to cook into the next community favorite."
					initial={currentUser?.username?.charAt(0).toUpperCase() || "B"}
				/>
				<TouchableOpacity style={styles.imageBox} onPress={chooseImage}>
					{imageUri ? (
						<Image
							source={{ uri: imageUri }}
							style={styles.preview}
						/>
					) : (
						<>
							<Text style={styles.imageMark}>+</Text>
							<Text style={styles.imageText}>
								Add a recipe photo
							</Text>
						</>
					)}
				</TouchableOpacity>
				<Text style={styles.label}>Recipe name</Text>
				<TextInput
					value={title}
					onChangeText={setTitle}
					style={styles.input}
					placeholder="e.g. Spicy creamy pasta"
					placeholderTextColor="#9AA59D"
				/>
				<Text style={styles.label}>Description</Text>
				<TextInput
					value={description}
					onChangeText={setDescription}
					style={[styles.input, styles.textArea]}
					multiline
					placeholder="What makes this dish worth sharing?"
					placeholderTextColor="#9AA59D"
				/>
				<DifficultySlider value={difficulty} onChange={setDifficulty} />
				<Text style={styles.label}>Ingredients</Text>
				<TextInput
					value={ingredients}
					onChangeText={setIngredients}
					style={[styles.input, styles.largeArea]}
					multiline
					placeholder="1. Pasta\n2. Garlic\n3. Parmesan"
					placeholderTextColor="#9AA59D"
				/>
				<Text style={styles.label}>Steps</Text>
				<TextInput
					value={steps}
					onChangeText={setSteps}
					style={[styles.input, styles.largeArea]}
					multiline
					placeholder="1. Boil the pasta\n2. Sauté the garlic\n3. Combine and serve"
					placeholderTextColor="#9AA59D"
				/>
				<Text style={styles.label}>Dietary restrictions</Text>
				{loadingOptions ? (
					<ActivityIndicator color="#688A5E" />
				) : (
					<View style={styles.tags}>
						{dietaryOptions.map((option) => (
							<TouchableOpacity
								key={option.id}
								onPress={() =>
									toggle(option.id, setRestrictions)
								}
								style={[
									styles.tag,
									restrictions.includes(option.id) &&
										styles.selectedTag,
								]}
							>
								<Text
									style={[
										styles.tagText,
										restrictions.includes(option.id) &&
											styles.selectedTagText,
									]}
								>
									{option.name}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				)}
				<Text style={styles.label}>Cuisine</Text>
				{loadingOptions ? (
					<ActivityIndicator color="#688A5E" />
				) : (
					<View style={styles.tags}>
						{cuisineOptions.map((option) => (
							<TouchableOpacity
								key={option.id}
								onPress={() => toggle(option.id, setCuisines)}
								style={[
									styles.tag,
									cuisines.includes(option.id) &&
										styles.selectedTag,
								]}
							>
								<Text
									style={[
										styles.tagText,
										cuisines.includes(option.id) &&
											styles.selectedTagText,
									]}
								>
									{option.name}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				)}
				<TouchableOpacity
					style={[styles.publish, publishing && styles.disabled]}
					onPress={publish}
					disabled={publishing || loadingOptions}
				>
					{publishing ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.publishText}>Publish recipe</Text>
					)}
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: AppTheme.background },
	container: {
		width: "100%",
		maxWidth: 640,
		alignSelf: "center",
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 48,
	},
	imageBox: {
		height: 190,
		borderRadius: 18,
		backgroundColor: AppTheme.warmSoft,
		borderWidth: 1,
		borderColor: AppTheme.border,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		marginBottom: 24,
	},
	preview: { width: "100%", height: "100%" },
	imageMark: { color: AppTheme.warm, fontSize: 34, fontWeight: "300" },
	imageText: {
		color: AppTheme.warm,
		fontSize: 14,
		fontWeight: "700",
		marginTop: 2,
	},
	label: {
		color: AppTheme.muted,
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.2,
		marginTop: 18,
		marginBottom: 8,
	},
	input: {
		backgroundColor: AppTheme.surface,
		borderWidth: 1,
		borderColor: AppTheme.border,
		borderRadius: 13,
		paddingHorizontal: 14,
		paddingVertical: 13,
		color: AppTheme.text,
		fontSize: 15,
	},
	textArea: { minHeight: 88, textAlignVertical: "top" },
	largeArea: { minHeight: 126, textAlignVertical: "top" },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tag: {
		backgroundColor: AppTheme.surface,
		borderWidth: 1,
		borderColor: AppTheme.border,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 9,
	},
	selectedTag: {
		backgroundColor: AppTheme.accent,
		borderColor: AppTheme.accent,
	},
	tagText: { color: AppTheme.muted, fontSize: 13 },
	selectedTagText: { color: "#FFFFFF" },
	publish: {
		backgroundColor: AppTheme.accent,
		borderRadius: 14,
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 30,
	},
	disabled: { opacity: 0.55 },
	publishText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
});
