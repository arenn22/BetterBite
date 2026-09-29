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
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Advanced"];

function SectionLabel({ children }: { children: string }) {
	return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Field({
	label,
	value,
	onChangeText,
	placeholder,
	multiline = false,
}: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder: string;
	multiline?: boolean;
}) {
	return (
		<View style={styles.fieldGroup}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#B8B9B0"
				multiline={multiline}
				style={[styles.input, multiline && styles.descriptionInput]}
				textAlignVertical={multiline ? "top" : "center"}
			/>
		</View>
	);
}

function ListEditor({
	items,
	setItems,
	type,
}: {
	items: string[];
	setItems: React.Dispatch<React.SetStateAction<string[]>>;
	type: "ingredient" | "step";
}) {
	return (
		<View>
			{items.map((item, index) => (
				<View key={`${type}-${index}`} style={styles.listRow}>
					<View style={styles.numberBubble}>
						<Text style={styles.numberText}>{index + 1}</Text>
					</View>
					<TextInput
						value={item}
						onChangeText={(value) =>
							setItems((current) =>
								current.map((entry, itemIndex) =>
									itemIndex === index ? value : entry,
								),
							)
						}
						placeholder={
							type === "ingredient"
								? [
										"2 cloves garlic",
										"1 cup flour",
										"3 tbsp olive oil",
									][index % 3]
								: `Step ${index + 1}`
						}
						placeholderTextColor="#B8B9B0"
						style={styles.listInput}
					/>
					{items.length > 1 ? (
						<Pressable
							onPress={() =>
								setItems((current) =>
									current.filter(
										(_, itemIndex) => itemIndex !== index,
									),
								)
							}
							style={styles.removeButton}
							accessibilityLabel={`Remove ${type} ${index + 1}`}
						>
							<Text style={styles.removeText}>x</Text>
						</Pressable>
					) : null}
				</View>
			))}
			<Pressable
				onPress={() => setItems((current) => [...current, ""])}
				style={styles.addButton}
			>
				<View style={styles.addIcon}>
					<Text style={styles.addIconText}>+</Text>
				</View>
				<Text style={styles.addText}>
					Add {type === "ingredient" ? "ingredient" : "step"}
				</Text>
			</Pressable>
		</View>
	);
}

function TagChips({
	options,
	selected,
	toggle,
}: {
	options: { id: number; name: string }[];
	selected: number[];
	toggle: (id: number) => void;
}) {
	return (
		<View style={styles.tags}>
			{options.map((option) => {
				const active = selected.includes(option.id);
				return (
					<Pressable
						key={option.id}
						onPress={() => toggle(option.id)}
						style={[styles.tag, active && styles.selectedTag]}
					>
						<Text
							style={[
								styles.tagText,
								active && styles.selectedTagText,
							]}
						>
							{option.name}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

function PreviewCard({
	title,
	difficulty,
	imageUri,
}: {
	title: string;
	difficulty: number;
	imageUri: string | null;
}) {
	return (
		<View style={styles.previewCard}>
			<View style={styles.previewImage}>
				{imageUri ? (
					<Image
						source={{ uri: imageUri }}
						style={styles.previewImage}
					/>
				) : (
					<Text style={styles.cameraIcon}>[ ]</Text>
				)}
				<View style={styles.previewBadge}>
					<Text style={styles.previewBadgeText}>
						{DIFFICULTIES[difficulty - 1]}
					</Text>
				</View>
			</View>
			<View style={styles.previewBody}>
				<Text style={styles.previewTitle} numberOfLines={2}>
					{title || "Your recipe title..."}
				</Text>
				<Text style={styles.previewAuthor}>by you</Text>
			</View>
		</View>
	);
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
	const [ingredientItems, setIngredientItems] = useState(["", ""]);
	const [stepItems, setStepItems] = useState(["", ""]);
	const [difficulty, setDifficulty] = useState(2);
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [restrictions, setRestrictions] = useState<number[]>([]);
	const [cuisines, setCuisines] = useState<number[]>([]);
	const [publishing, setPublishing] = useState(false);

	const doneFlags = [
		imageUri !== null,
		title.trim().length > 2,
		ingredientItems.some((item) => item.trim()),
		stepItems.some((item) => item.trim()),
	];
	const completed = doneFlags.filter(Boolean).length;
	const progress = Math.round((completed / doneFlags.length) * 100);

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
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]?.uri)
			setImageUri(result.assets[0].uri);
	}

	function updateListValue(
		index: number,
		value: string,
		setter: React.Dispatch<React.SetStateAction<string[]>>,
	) {
		setter((current) => {
			const next = [...current];
			next[index] = value;
			return next;
		});
	}

	function addListItem(
		setter: React.Dispatch<React.SetStateAction<string[]>>,
	) {
		setter((current) => [...current, ""]);
	}

	function removeListItem(
		index: number,
		setter: React.Dispatch<React.SetStateAction<string[]>>,
	) {
		setter((current) => {
			if (current.length === 1) return [""];
			return current.filter((_, itemIndex) => itemIndex !== index);
		});
	}

	async function publish() {
		if (!currentUser) return;
		const parsedIngredients = ingredientItems.filter((item) => item.trim());
		const parsedSteps = stepItems.filter((item) => item.trim());
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
			setIngredientItems(["", ""]);
			setStepItems(["", ""]);
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
				/>
				<View style={styles.progressHeader}>
					<Text style={styles.progressText}>
						Step {Math.min(completed + 1, 4)} of 4
					</Text>
					<Text style={styles.progressPercent}>
						{progress}% complete
					</Text>
				</View>
				<View style={styles.progressTrack}>
					<View
						style={[styles.progressFill, { width: `${progress}%` }]}
					/>
				</View>

				<View style={styles.photoSection}>
					<SectionLabel>Recipe photo</SectionLabel>
					<Pressable style={styles.imageBox} onPress={chooseImage}>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								style={styles.preview}
							/>
						) : (
							<>
								<View style={styles.photoCircle}>
									<Text style={styles.photoPlus}>+</Text>
								</View>
								<Text style={styles.imageText}>
									Add a recipe photo
								</Text>
							</>
						)}
					</Pressable>
				</View>

				<Field
					label="Recipe name"
					value={title}
					onChangeText={setTitle}
					placeholder="e.g. Golden Garlic Pasta"
				/>
				<Field
					label="Description"
					value={description}
					onChangeText={setDescription}
					placeholder="What makes this dish special? Any tips?"
					multiline
				/>

				<View style={styles.section}>
					<Text style={styles.fieldLabel}>Difficulty</Text>
					<View style={styles.difficultyRow}>
						{DIFFICULTIES.map((label, index) => (
							<Pressable
								key={label}
								onPress={() => setDifficulty(index + 1)}
								style={[
									styles.difficultyButton,
									difficulty === index + 1 &&
										styles.activeDifficulty,
								]}
							>
								<Text
									style={[
										styles.difficultyText,
										difficulty === index + 1 &&
											styles.activeDifficultyText,
									]}
								>
									{label}
								</Text>
							</Pressable>
						))}
					</View>
					<DifficultySlider
						value={difficulty}
						onChange={setDifficulty}
					/>
				</View>

				<View style={styles.section}>
					<Text style={styles.fieldLabel}>Ingredients</Text>
					<ListEditor
						items={ingredientItems}
						setItems={setIngredientItems}
						type="ingredient"
					/>
				</View>
				<View style={styles.section}>
					<Text style={styles.fieldLabel}>Steps</Text>
					<ListEditor
						items={stepItems}
						setItems={setStepItems}
						type="step"
					/>
				</View>
				<View style={styles.section}>
					<Text style={styles.fieldLabel}>Dietary</Text>
					{loadingOptions ? (
						<ActivityIndicator color={AppTheme.accent} />
					) : (
						<TagChips
							options={dietaryOptions}
							selected={restrictions}
							toggle={(id) => toggle(id, setRestrictions)}
						/>
					)}
				</View>
				<View style={styles.section}>
					<Text style={styles.fieldLabel}>Cuisine</Text>
					{loadingOptions ? (
						<ActivityIndicator color={AppTheme.accent} />
					) : (
						<TagChips
							options={cuisineOptions}
							selected={cuisines}
							toggle={(id) => toggle(id, setCuisines)}
						/>
					)}
				</View>

				<View style={styles.previewSection}>
					<View style={styles.previewHeading}>
						<SectionLabel>Feed preview</SectionLabel>
						<View style={styles.liveDot} />
					</View>
					<View style={styles.previewRow}>
						<View style={styles.previewWidth}>
							<PreviewCard
								title={title}
								difficulty={difficulty}
								imageUri={imageUri}
							/>
						</View>
						<View style={styles.previewCopy}>
							<Text style={styles.previewDescription}>
								This is how your recipe will appear in Explore
								and on your profile.
							</Text>
							{progress === 100 ? (
								<Text style={styles.readyText}>
									Ready to publish
								</Text>
							) : null}
						</View>
					</View>
				</View>

				<Pressable
					style={[
						styles.publish,
						(!title.trim() || publishing) && styles.disabled,
					]}
					onPress={publish}
					disabled={publishing || loadingOptions}
				>
					{publishing ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.publishText}>
							{title.trim()
								? "Publish recipe"
								: "Add a name to publish"}
						</Text>
					)}
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#F7F7F4" },
	container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44 },
	sectionLabel: {
		color: AppTheme.muted,
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.5,
		marginBottom: 8,
		textTransform: "uppercase",
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	progressText: { color: AppTheme.muted, fontSize: 11, fontWeight: "700" },
	progressPercent: { color: AppTheme.warm, fontSize: 11, fontWeight: "700" },
	progressTrack: {
		height: 6,
		backgroundColor: "#F0E8DF",
		borderRadius: 4,
		overflow: "hidden",
		marginBottom: 24,
	},
	progressFill: {
		height: "100%",
		backgroundColor: AppTheme.warm,
		borderRadius: 4,
	},
	photoSection: { marginBottom: 4 },
	imageBox: {
		height: 176,
		borderRadius: 18,
		backgroundColor: AppTheme.warmSoft,
		borderWidth: 2,
		borderColor: AppTheme.warm,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	preview: { width: "100%", height: "100%" },
	photoCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: AppTheme.warm,
		alignItems: "center",
		justifyContent: "center",
	},
	photoPlus: {
		color: "#FFFFFF",
		fontSize: 26,
		fontWeight: "300",
		lineHeight: 30,
	},
	imageText: {
		color: "#B56F4C",
		fontSize: 12,
		fontWeight: "700",
		marginTop: 10,
	},
	fieldGroup: { marginTop: 18 },
	fieldLabel: {
		color: AppTheme.text,
		fontSize: 12,
		fontWeight: "700",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 13,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: AppTheme.text,
		fontSize: 14,
	},
	descriptionInput: { minHeight: 88, paddingTop: 12 },
	section: { marginTop: 24 },
	difficultyRow: { flexDirection: "row", gap: 6 },
	difficultyButton: {
		flex: 1,
		minHeight: 36,
		borderRadius: 11,
		borderWidth: 1,
		borderColor: "#E5E5E0",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
	},
	activeDifficulty: {
		backgroundColor: AppTheme.warmSoft,
		borderColor: AppTheme.warm,
	},
	difficultyText: { color: "#A6A69F", fontSize: 10, fontWeight: "800" },
	activeDifficultyText: { color: "#B56F4C" },
	listRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
	},
	numberBubble: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	numberText: { color: AppTheme.accent, fontSize: 10, fontWeight: "800" },
	listInput: {
		flex: 1,
		height: 42,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 12,
		paddingHorizontal: 12,
		color: AppTheme.text,
		fontSize: 14,
	},
	removeButton: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	removeText: { color: "#B8B9B0", fontSize: 22, fontWeight: "300" },
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 7,
		marginTop: 2,
	},
	addIcon: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1,
		borderColor: AppTheme.accent,
		alignItems: "center",
		justifyContent: "center",
	},
	addIconText: { color: AppTheme.accent, fontSize: 16, lineHeight: 18 },
	addText: { color: AppTheme.accent, fontSize: 12, fontWeight: "700" },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	tag: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 18,
		paddingHorizontal: 12,
		paddingVertical: 9,
	},
	selectedTag: {
		backgroundColor: AppTheme.accent,
		borderColor: AppTheme.accent,
	},
	tagText: { color: AppTheme.text, fontSize: 12, fontWeight: "700" },
	selectedTagText: { color: "#FFFFFF" },
	previewSection: { marginTop: 28 },
	previewHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
	liveDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: AppTheme.warm,
		marginBottom: 8,
	},
	previewRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
	previewWidth: { width: 154 },
	previewCard: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E5E0",
		borderRadius: 16,
		overflow: "hidden",
	},
	previewImage: {
		height: 106,
		width: "100%",
		backgroundColor: "#F0E8DF",
		alignItems: "center",
		justifyContent: "center",
	},
	cameraIcon: { color: AppTheme.warm, fontSize: 28, opacity: 0.65 },
	previewBadge: {
		position: "absolute",
		top: 8,
		left: 8,
		backgroundColor: AppTheme.accentSoft,
		borderRadius: 8,
		paddingHorizontal: 7,
		paddingVertical: 3,
	},
	previewBadgeText: {
		color: AppTheme.accent,
		fontSize: 9,
		fontWeight: "800",
	},
	previewBody: { padding: 10 },
	previewTitle: {
		color: AppTheme.text,
		fontSize: 12,
		fontWeight: "700",
		lineHeight: 16,
		minHeight: 32,
	},
	previewAuthor: { color: AppTheme.muted, fontSize: 10, marginTop: 7 },
	previewCopy: { flex: 1, paddingTop: 4 },
	previewDescription: { color: AppTheme.muted, fontSize: 11, lineHeight: 17 },
	readyText: {
		color: AppTheme.accent,
		fontSize: 11,
		fontWeight: "700",
		marginTop: 10,
	},
	publish: {
		minHeight: 54,
		borderRadius: 16,
		backgroundColor: AppTheme.accent,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 30,
		shadowColor: AppTheme.accent,
		shadowOpacity: 0.2,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 5 },
		elevation: 3,
	},
	disabled: { backgroundColor: "#C8D4C0", shadowOpacity: 0 },
	publishText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
