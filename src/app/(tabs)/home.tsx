import DifficultySlider from "@/components/difficulty-slider";
import { useAuthContext } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase";
import {
	createPost,
	fetchCuisines,
	fetchDietaryRestrictions,
	fetchFriendRequests,
	fetchFriends,
	fetchUserProfile,
	respondToFriendRequest,
	searchUsers,
	sendFriendRequest,
} from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";

// Type structures matching database lookup columns
interface LookupOption {
	id: number;
	name: string;
}

export default function HomeScreen() {
	const { currentUser } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [fetchingOptions, setFetchingOptions] = useState(true);

	// Lists populated dynamically from the database
	const [dietaryOptions, setDietaryOptions] = useState<LookupOption[]>([]);
	const [cuisineOptions, setCuisineOptions] = useState<LookupOption[]>([]);

	// Custom User Form Inputs State
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [difficulty, setDifficulty] = useState(2);
	const [ingredientsInput, setIngredientsInput] = useState("");
	const [stepsInput, setStepsInput] = useState("");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>([]);
	const [selectedCuisines, setSelectedCuisines] = useState<number[]>([]);

	const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchUserProfile>>>(null);
	const [friendSearch, setFriendSearch] = useState("");
	const [userResults, setUserResults] = useState<any[]>([]);
	const [friends, setFriends] = useState<any[]>([]);
	const [friendRequests, setFriendRequests] = useState<any[]>([]);
	const [communityLoading, setCommunityLoading] = useState(false);

	// 1. Fetch tags from the database on component mount
	useEffect(() => {
		async function loadOptions() {
			try {
				const [restrictions, cuisines] = await Promise.all([
					fetchDietaryRestrictions(),
					fetchCuisines()
				]);
				setDietaryOptions(restrictions);
				setCuisineOptions(cuisines);
			} catch (error: any) {
				console.error("Error loading options:", error);
				Alert.alert("Error", "Failed to load dietary or cuisine filters from the database.");
			} finally {
				setFetchingOptions(false);
			}
		}
		loadOptions();
	}, []);

	useEffect(() => {
		if (!currentUser) {
			setProfile(null);
			setFriends([]);
			setFriendRequests([]);
			return;
		}

		const userId = currentUser.id;

		async function loadUserData() {
			try {
				const [currentProfile, currentFriends, currentFriendRequests] = await Promise.all([
					fetchUserProfile(userId),
					fetchFriends(),
					fetchFriendRequests(),
				]);
				setProfile(currentProfile);
				setFriends(currentFriends || []);
				setFriendRequests(currentFriendRequests || []);
			} catch (error: any) {
				Alert.alert("Community Error", error.message || "Could not load your community data.");
			}
		}

		loadUserData();
	}, [currentUser]);

	// Toggle item inclusions within selected arrays
	const toggleRestriction = (id: number) => {
		setSelectedRestrictions(prev =>
			prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
		);
	};

	const toggleCuisine = (id: number) => {
		setSelectedCuisines(prev =>
			prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
		);
	};

	const searchForUsers = async () => {
		if (!friendSearch.trim()) {
			setUserResults([]);
			return;
		}

		setCommunityLoading(true);
		try {
			setUserResults(await searchUsers(friendSearch.trim()));
		} catch (error: any) {
			Alert.alert("Search Failed", error.message || "Could not search for users.");
		} finally {
			setCommunityLoading(false);
		}
	};

	const sendRequestToUser = async (receiverId: string) => {
		setCommunityLoading(true);
		try {
			await sendFriendRequest(receiverId);
			Alert.alert("Request Sent", "Your friend request was sent.");
		} catch (error: any) {
			Alert.alert("Request Failed", error.message || "Could not send the friend request.");
		} finally {
			setCommunityLoading(false);
		}
	};

	const refreshFriends = async () => {
		setCommunityLoading(true);
		try {
			setFriends((await fetchFriends()) || []);
		} catch (error: any) {
			Alert.alert("Refresh Failed", error.message || "Could not load your friends.");
		} finally {
			setCommunityLoading(false);
		}
	};

	const respondToRequest = async (requestId: number, accept: boolean) => {
		setCommunityLoading(true);
		try {
			await respondToFriendRequest(requestId, accept);
			setFriendRequests((requests) => requests.filter((request) => request.id !== requestId));
			setFriends((await fetchFriends()) || []);
			Alert.alert("Request Updated", accept ? "Friend request accepted." : "Friend request declined.");
		} catch (error: any) {
			Alert.alert("Request Failed", error.message || "Could not update the friend request.");
		} finally {
			setCommunityLoading(false);
		}
	};

	const parseNumberedList = (value: string): string[] => {
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.map((line) => line.replace(/^\d+[.)-]\s*/, "").trim())
			.filter(Boolean);
	};

	// Launch Expo gallery picker
	const pickImage = async () => {
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert("Permission Required", "You must allow camera roll permissions to add images.");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (!result.canceled && result.assets?.[0]) {
			setImageUri(result.assets[0].uri);
		}
	};

	// Process file upload to Supabase Storage
	const uploadRecipeImage = async (fileUri: string): Promise<string> => {
		const filename = fileUri.split("/").pop() || `${Date.now()}.jpg`;
		const fileExt = filename.split(".").pop();
		const filePath = `${currentUser?.id || "anon"}/${Date.now()}.${fileExt}`;

		const response = await fetch(fileUri);
		const blob = await response.blob();

		const { error } = await supabase.storage
			.from("post-images") 
			.upload(filePath, blob, {
				contentType: 'image/jpeg',
				upsert: true,
			});

		if (error) throw error;

		const { data: publicUrlData } = supabase.storage
			.from("post-images")
			.getPublicUrl(filePath);

		if (!publicUrlData?.publicUrl) {
			throw new Error("Could not generate the public image URL.");
		}

		return publicUrlData.publicUrl;
	};

	// Save entire post transaction structure
	const handleCreateRecipePost = async () => {
		if (!currentUser) {
			Alert.alert("Error", "You must be logged in to create a post.");
			return;
		}
		if (!title.trim() || !description.trim() || !imageUri) {
			Alert.alert("Missing Fields", "Please add a title, description, and photo.");
			return;
		}

		const ingredients = parseNumberedList(ingredientsInput);
		const steps = parseNumberedList(stepsInput);

		if (ingredients.length === 0 || steps.length === 0) {
			Alert.alert("Missing Ingredients or Steps", "Please enter at least one ingredient and one step.");
			return;
		}

		setLoading(true);

		try {
			const publicUrl = await uploadRecipeImage(imageUri);

			const postPayload = {
				title: title.trim(),
				description: description.trim(),
				difficulty,
				imageUrl: publicUrl,
				authorUsername: currentUser.username || "anonymous",
				recipeJson: {
					ingredients,
					steps,
				},
				restrictionIds: selectedRestrictions,
				cuisineIds: selectedCuisines,
			};

			const newPostUuid = await createPost(postPayload);
			Alert.alert("Success 🎉", `Recipe Published!\n\nID: ${newPostUuid}`);

			// Reset form interface values
			setTitle("");
			setDescription("");
			setDifficulty(2);
			setIngredientsInput("");
			setStepsInput("");
			setImageUri(null);
			setSelectedRestrictions([]);
			setSelectedCuisines([]);
		} catch (error: any) {
			Alert.alert("Publish Failed ❌", error.message || "Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
			<Text style={styles.title}>New Recipe</Text>

			<View style={styles.card}>
				{/* Image Picker Box */}
				<TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
					{imageUri ? (
						<Image source={{ uri: imageUri }} style={styles.previewImage} />
					) : (
						<Text style={styles.placeholderText}>📸 Press to upload Recipe Image</Text>
					)}
				</TouchableOpacity>

				{/* Text inputs */}
				<Text style={styles.label}>Recipe Name</Text>
				<TextInput
					style={styles.input}
					value={title}
					onChangeText={setTitle}
					placeholder="e.g., Spicy Creamy Pasta"
					placeholderTextColor="#9ca3af"
				/>

				<Text style={styles.label}>Description</Text>
				<TextInput
					style={[styles.input, styles.textArea]}
					value={description}
					onChangeText={setDescription}
					placeholder="Describe instructions or flavor details..."
					placeholderTextColor="#9ca3af"
					multiline
					numberOfLines={3}
				/>

				<DifficultySlider value={difficulty} onChange={setDifficulty} />

				<Text style={styles.label}>Ingredients (numbered list)</Text>
				<TextInput
					style={[styles.input, styles.textAreaLarge]}
					value={ingredientsInput}
					onChangeText={setIngredientsInput}
					placeholder="1. Pasta\n2. Garlic\n3. Parmesan"
					placeholderTextColor="#9ca3af"
					multiline
					numberOfLines={5}
				/>

				<Text style={styles.label}>Steps (numbered list)</Text>
				<TextInput
					style={[styles.input, styles.textAreaLarge]}
					value={stepsInput}
					onChangeText={setStepsInput}
					placeholder="1. Boil the pasta\n2. Sauté garlic\n3. Combine and serve"
					placeholderTextColor="#9ca3af"
					multiline
					numberOfLines={5}
				/>

				{/* Dynamic Dietary Tags */}
				<Text style={styles.label}>Dietary Restrictions</Text>
				{fetchingOptions ? (
					<ActivityIndicator size="small" color="#687B5D" style={{ alignSelf: 'flex-start' }} />
				) : (
					<View style={styles.tagGroup}>
						{dietaryOptions.map((option) => {
							const isSelected = selectedRestrictions.includes(option.id);
							return (
								<TouchableOpacity
									key={option.id}
									style={[styles.tagButton, isSelected && styles.tagActive]}
									onPress={() => toggleRestriction(option.id)}
								>
									<Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
										{option.name}
									</Text>
								</TouchableOpacity>
							);
						})}
						{dietaryOptions.length === 0 && <Text style={styles.emptyText}>No dietary tags found in DB.</Text>}
					</View>
				)}

				{/* Dynamic Cuisine Tags */}
				<Text style={styles.label}>Cuisine Type</Text>
				{fetchingOptions ? (
					<ActivityIndicator size="small" color="#687B5D" style={{ alignSelf: 'flex-start' }} />
				) : (
					<View style={styles.tagGroup}>
						{cuisineOptions.map((option) => {
							const isSelected = selectedCuisines.includes(option.id);
							return (
								<TouchableOpacity
									key={option.id}
									style={[styles.tagButton, isSelected && styles.tagActive]}
									onPress={() => toggleCuisine(option.id)}
								>
									<Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
										{option.name}
									</Text>
								</TouchableOpacity>
							);
						})}
						{cuisineOptions.length === 0 && <Text style={styles.emptyText}>No cuisines found in DB.</Text>}
					</View>
				)}

				{/* Submit Control */}
				<TouchableOpacity
					style={[styles.button, (loading || fetchingOptions) && styles.buttonDisabled]}
					onPress={handleCreateRecipePost}
					disabled={loading || fetchingOptions}
				>
					{loading ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>Publish Recipe Post</Text>
					)}
				</TouchableOpacity>
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Community</Text>
				{currentUser ? (
					<>
						<Text style={styles.communityText}>
							Signed in as {profile?.username || currentUser.username}
						</Text>

						<Text style={styles.label}>Find Users</Text>
						<View style={styles.actionRow}>
							<TextInput
								style={[styles.input, styles.actionInput]}
								value={friendSearch}
								onChangeText={setFriendSearch}
								placeholder="Search by username"
								placeholderTextColor="#9ca3af"
								onSubmitEditing={searchForUsers}
							/>
							<TouchableOpacity style={styles.smallButton} onPress={searchForUsers} disabled={communityLoading}>
								<Text style={styles.buttonText}>Search</Text>
							</TouchableOpacity>
						</View>

						{userResults.map((user) => (
							<View style={styles.resultRow} key={user.id}>
								<View>
									<Text style={styles.resultName}>{user.display_name || user.username}</Text>
									<Text style={styles.resultMeta}>{user.username} · {user.id}</Text>
								</View>
								<TouchableOpacity style={styles.smallButton} onPress={() => sendRequestToUser(user.id)} disabled={communityLoading}>
									<Text style={styles.buttonText}>Add</Text>
								</TouchableOpacity>
							</View>
						))}

						<Text style={styles.label}>Pending Friend Requests ({friendRequests.length})</Text>
						{friendRequests.length > 0 ? friendRequests.map((request, index) => {
							const senderName = request.sender_username || request.username || request.display_name || request.sender_id || "Someone";

							return (
								<View style={styles.resultRow} key={request.id || index}>
									<Text style={styles.resultName}>{senderName} sent you a friend request</Text>
									<View style={styles.actionRow}>
										<TouchableOpacity style={styles.smallButton} onPress={() => respondToRequest(request.id, true)} disabled={communityLoading}>
											<Text style={styles.buttonText}>Accept</Text>
										</TouchableOpacity>
										<TouchableOpacity style={styles.secondaryButton} onPress={() => respondToRequest(request.id, false)} disabled={communityLoading}>
											<Text style={styles.secondaryButtonText}>Decline</Text>
										</TouchableOpacity>
									</View>
								</View>
							);
						}) : <Text style={styles.emptyText}>No pending friend requests.</Text>}

						<View style={styles.friendsHeader}>
							<Text style={styles.label}>Friends ({friends.length})</Text>
							<TouchableOpacity onPress={refreshFriends} disabled={communityLoading}>
								<Text style={styles.refreshText}>Refresh</Text>
							</TouchableOpacity>
						</View>
						{friends.length > 0 ? friends.map((friend, index) => (
							<Text style={styles.communityText} key={friend.id || friend.friend_id || index}>
								{friend.username || friend.display_name || friend.friend_username || friend.id || "Friend"}
							</Text>
						)) : <Text style={styles.emptyText}>No friends found yet.</Text>}
					</>
				) : (
					<Text style={styles.emptyText}>Sign in to search for users and manage friends.</Text>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 24, backgroundColor: "#f7f7f5" },
	title: { fontSize: 32, fontWeight: "700", marginBottom: 24, marginTop: 40, color: "#1f2a1f" },
	card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
	sectionTitle: { fontSize: 24, fontWeight: "700", color: "#1f2a1f" },
	communityText: { color: "#4b5563", fontSize: 14, marginTop: 6 },
	actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
	actionInput: { flex: 1 },
	smallButton: { backgroundColor: "#687B5D", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
	secondaryButton: { backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
	secondaryButtonText: { color: "#4b5563", fontWeight: "600" },
	resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
	resultName: { color: "#1f2a1f", fontWeight: "600" },
	resultMeta: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
	friendsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	refreshText: { color: "#687B5D", fontWeight: "600" },
	imagePlaceholder: { height: 180, backgroundColor: "#f3f4f6", borderRadius: 12, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "dashed", marginBottom: 8 },
	previewImage: { width: "100%", height: "100%" },
	placeholderText: { color: "#687B5D", fontSize: 14, fontWeight: "600" },
	label: { fontSize: 14, color: "#687B5D", marginTop: 18, marginBottom: 6, fontWeight: "600" },
	input: { backgroundColor: "#ffffff", borderRadius: 10, padding: 12, fontSize: 16, borderColor: "#e5e7eb", borderWidth: 1, color: "#1f2a1f" },
	textArea: { height: 80, textAlignVertical: "top" },
	textAreaLarge: { height: 120, textAlignVertical: "top" },
	tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
	tagButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
	tagActive: { backgroundColor: "#687B5D", borderColor: "#687B5D" },
	tagText: { color: "#4b5563", fontSize: 14, fontWeight: "500" },
	tagTextActive: { color: "#ffffff" },
	button: { backgroundColor: "#687B5D", paddingVertical: 14, borderRadius: 12, marginTop: 28, alignItems: "center", justifyContent: "center" },
	buttonDisabled: { backgroundColor: "#a3b29a" },
	buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
	emptyText: { color: "#9ca3af", fontSize: 14, fontStyle: "italic", marginTop: 4 }
});
