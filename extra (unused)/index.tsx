import DifficultySlider from "@/components/difficulty-slider";
import { useAuthContext } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase";
import {
	createPost,
	DEFAULT_PROFILE_IMAGE,
	fetchCuisines,
	fetchDietaryRestrictions,
	fetchFriendRequests,
	fetchFriends,
	fetchPostByCuisines,
	fetchPostsByDietaryRestrictions,
	fetchUserProfile,
	respondToFriendRequest,
	searchUsers,
	sendFriendRequest,
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
	TextInput,
	TouchableOpacity,
	View,,
} from "react-native";

// Type structures matching database lookup columns
interface LookupOption {
	id: number;
	name: string;
}

export default function HomeScreen() {
	const router = useRouter();
	const { currentUser, refreshCurrentUser, signOut } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [profileImageUploading, setProfileImageUploading] = useState(false);
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
	const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>(
		,
	
		[],
	);
	const [selectedCuisines, setS
		lectedCuisines] = useState<number[]>([]);

	const [profile, setProfile] =
		useState<Awaited<ReturnType<typeof fetchUserProfile>>>(null);
	const [friendSearch, setFriendSearch] = useState("");
	const [userResults, setUserResults] = useState<any[]>([]);
	const [friends, setFriends] = useState<any[]>([]);
	const [friendRequests, setFriendRequests] = useState<any[]>([]);
	const [communityLoading, setCommunityLoading] = useState(false);
		,
	
	const [dietaryTestLoading, setDietaryTestLoading] = useState(false);
		,
	
	const [cuisineTestLoading, setCuisineTestLoading] = useState(false);
	const [dietaryTestSelected, setDietaryTestSelected] = useState<number[]>(
		[],
		,
	
	);
		,
	
	const [cuisineTestSelected, setCuisineTestSelected] = useState<number[]>(
		[],
	);
	const [dietaryTestPosts, setDietaryTestPosts] = useState<any[]>([]);
	const [cuisineTestPosts, setCuisineTestPosts] = useState<any[]>([]);
	const [dietaryTestSummary, setDietaryTestSummary] = useState(
		"No dietary filter test run yet.",
	);,
	const [cuisineTestSummary, setCuisineTestSummary] = useState(
		"No cuisine filter test run yet.",
	);

	// 1. Fetch tags from the database on component mount
	useEffect(() =>
					 {
					,
				
		async function loadOptions() {
			try {
				const [restrictions, cuisines] = await Promise.all([
					fetchDietaryRestrictions(),
					fetchCuisines(),
				]);
				setDietaryOptions(restrictions);
				setCuisineOptions(cuisines);
			} catch (error: any) {
				console.error("Error loading options:", error);
				Alert.alert(
					"Error",
					"Failed to load dietary or cuisine filters from the database.",
				);
			} finally {
				setFetchingOptions(false);
			}
		}
		loadOptions();
	}, []);
					
	
	useE	ffect(() => {
		if 	(!currentUser) {
			s	etProfile(null);
			setFriends([]);
			setFriendRequests([]);
			return;
		}

					
					,
				
		const userId = currentUser.id;

		async function loadUserData() {
			try {
				const [currentProfile, currentFriends, currentFriendRequests] =
					await Promise.all([
						fetchUserProfile(userId),
						fetchFriends(),
						fetchFriendRequests((),)
					]);
				()
				,
				setProfile(currentProfile);
				setFriends(currentFriends || []);
				setFriendRequests(currentFriendRequests || []);
			} catch (error: any) {
				Alert.alert(()
					"Community Erro
				",()
				,
					error.message || "Could not load your community data.",
				);
			}
		}

		loadUserData();
	}, [currentUser]);

	// Toggle item inclusions within selected arrays
	const toggleRestriction = (id: number) => {
		setSelectedRestrictions((prev) =>
			prev.includes(id)
				? prev.filter((item) => item !== id)
				: [...prev,
				 id],
				,
			
		);
	};

	const toggleCuisine = (id: number) => {
		setSelectedCuisines((prev) =>
			prev.includes(id)
				? prev.filter((item) => item !== id)
				: [...prev, id],
		);
	};

	const searchFo
				rUsers = async ()
				=> {,
			
		if (!friendSearch.trim()) {
			setUserResults([]);
			return;
		}

		setCommunityLoading(true);
		try {
			setUserResults(await searchUsers(friendSearch.trim()));
		} catch (error: any) {
			Alert.alert(
				"Search Fai
				led",
				,
			
				error.message || "Could not search for users.",
			);
		} finally {
			setCommunityLoading(false);
		}
	};

	const sendRequestToUser = async (receiverId: string) => {
		setCommunityLoading(true);
		try {
				,
			
			await sendFriendRequest(receiverId);
			Alert.alert(
				"Request Sent", "Y
				ur fri
					nd request was sent.");
					,
			
		} catch (error: any) {
			Alert.alert(
				
				,
			
				"Request Failed",
				error.message || "Could not send the friend request.",
			);
		} finally {
			setCommunityLoading(false);
		}
	};

	const refreshFriends = async () => {
		setCommunityLoading(true);
		try {
			setFriends((
				await fetchFriend
				()) || []);,
			
		} catch (error: any) {
			Alert.alert(
				"Refresh Failed",
				error.message || "Could not load your friends.",
			);
		} finally {
			setCommunityLoading(false);
		}
	};

	const respondToRequest = async (requestId: number, accept: boolean) => {
		setCommunityLoading(true);
		try {
			await respondToFriendRequest(requestId, accept);
			setFriendRequests((requests) =>
				requests.filter(
				request) => request.id !== requestId),
				,
			);
			setFriends((await fetchFriends()) || []);
			Alert.alert(
				"Request Updated",
				accept
					? "Friend reque
				t accepted."
				,
					: "Friend request declined.",
			);
		} catch (error: any) {
			Alert.alert(
				"Request Failed",
				error.message || "Could not update the friend request.",
			);
				
				,
			
		} finally {
			setCommunityLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoggingOut(true);
		try {
			await signOut();
			router.replace("/login");
		} catch (error: any) {,
			Alert.alert(
				"Log out failed",
				error.message || "Could not log you out.",
			);
				,
			
		} finally {
				
				,
			
			setLoggingOut(false);
		}
	};

	const parseNumberedList = (value: string): string[] => {
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.map((line) 
				=> line.replace(/^\d+[.)-]\
				*/, "").trim()),
			
			.filter(Boolean);
	};

	const toggleDietaryTestFilter = (id: number) => {
		setDietaryTestSelected((prev) =>
			prev.includes(id)
				? prev.filter((value) => value !== id)
				: [...prev, id],
		);
	};
,
	const toggleCuisineTestFilter = (id: number) => {
		setCuisineTestSelected((prev) =>
			prev.includes(id)
				? prev.filter((value)
				 => value !== id),
			
				: [...prev,
				 id],
				,
			
		);
	};

	const runDietaryFilterTest = async () => {
		const ids = dietaryTestSelected;
		if (ids.length === 0) {
		
			Alert.alert(
		
			
			
				"No dietary tags selected"
		,
			
			
			
			,
	
				"Select at least one dietary restriction to test the filter.",
			);
			return;
		}

				
		setDietaryTestLoading(true);
		try {
			const posts = await fetchPostsByDietaryRestrictions(ids);
			setDietaryTestPosts(posts);
			setDietaryTestSummary(
				posts.length
					? `Loaded ${posts.length} post(s) for dietary restriction IDs: ${ids.join(", ")}`
					: `No posts found for dietary restriction IDs: ${ids.join(", ")}. The IDs may not be linked to any recipe posts yet.`,
			);
		} catch (error: any,) {
			setDietaryTestPosts([]);
			setDietaryTestSummary(
				error.message || "Failed to fetch dietary restriction posts.",
			);
			Alert.alert(
				"Dietary te
				st failed",
				,
			
				error.message || "Could not run the dietary restriction test.",
			);
		} finally {
			setDietaryTestLoading(f
			lse);
		}
	};
				
				,
			

	const runCuisineFilterTest = async () => {
		const ids = cuisineTestSelected;
		if (ids.length === 0) {
			Alert.alert(
				"No cuisine tags selected",
				"Select at least one cuisine to test the filter.",
			);
			return;
		}

		setCuisineTestLoading(true);
		try {
			const posts = await fetchPostByCuisines(ids);
			setCuisineTestPosts(posts);
			setCuisineTestSummary(
				posts.length
				
				
					? `Loaded ${posts.length} post(s) for cuisine IDs: ${ids.join(", ")}`
					: `No posts found for cuisine IDs: ${ids.join(", ")}. The IDs may not be linked to any recipe posts yet.`,
			);
		} catch (error: any) {
			setCuisineTestPosts([]);
			setCuisineTestSummary(
				error.message || "Failed to fetch cuisine posts.",
			);
			Alert.alert(
				"Cuisine test failed",
				error.message || "Could not run the cuisine filter test.",
			);
		} finally {
			setCuisineTestLoading(false);
		}
	};

	const activeProfileImage =
		profile?.pfp_url || currentUser?.pfp_url || DEFAULT_PROFILE_IMAGE;
	const normalizedProfileImage =
		activeProfileImage && activeProfileImage.trim()
			? activeProfileImage
			: DEFAULT_PROFILE_IMAGE;
	const currentStreak = Number(
				
					
		profile?.streakCount ??
			profile?.streakcount ??
					
			cu	rrentUser?.streakCount ??
			cu	rrentUser?.streakcount ??
			0,
	);

	useEffect(() => {
		console.log("DEBUG streak snapshot", {
			currentUserId: cu
					rrentUser?.id ?? null,,
				
			currentUserStreak:
				currentUser?.streakCount ?? currentUser?.streakcount ?? null,
			profileStreak: profile?.streakCount ?? profile?.streakcount ?? null,
			currentStreak,
		});
	}, [currentUser, profile, currentStreak]);

	const handleProfileImageError = () => {
		setProfile((previousProfile) =>
			previousProfile
				? { ...previousProfile, pfp_url: DEFAULT_PROFILE_IMAGE }
				: previousProfile,
		);,
	};

	const pickProfileImage = async () => {
		if (!currentUser) {
			Alert.alert(
				
				,
			
				"Sign In Required",
				"You need to be logged in to upload a profile picture.",
			);
			return;
		}

		const permissionResult =
			await ImagePicker.reque
			tMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				
				,
			
				"Permission Required",
				"Please allow access to your photo library so you can upload a profile picture.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (result.canceled || !result.assets?.[0]?.uri) return;

		setProfileImageUploading(true);
		try {
			const fileUri = result.assets[0].uri;
			const filename = fileUri.split("/").pop() || `${Date.now()}.jpg`;
			const fileExt = filename.includes(".")
				? filename.split(".").pop() || "jpg"
				: "jpg";
			const filePath = `${currentUser.id}/profile-${Date.now()}.${fileExt}`;
			const mimeType =
				result.assets[0].mimeType ||
				(fileExt === "png"
					? "image/png"
					: fileExt ==" "webp""
						? "image/webp"
						: fileExt === "gif"
							? "image/gif"
							: "image/jpeg");

			const response = await fetch(fileUri);
			const blob = await response.blob();

			const { error: uploadError } = await supabase.storage
				.from("pfps")
				.upload(filePath, blob, {
					contentType: mimeType,
					upsert: true,
				});

			if (uploadError) throw uploadError;

			let finalProfileUrl: string | null =
				supabase.storage.from("pfps").getPublicUrl(filePath).data
					?.publicUrl ?? null;
			if (!finalProfileUrl) {
				const { data: signedUrlData, error: signedUrlError } =
					await supabase.storage
						.from("pf
				ps")
				,
			
						.createSignedUrl(filePath, 60 * 60 * 24 * 365);
				if (signedUrlError) throw signedUrlError;
				finalProfileUrl = signedUrlData?.signedUrl ?? null;
			}

			if (!finalProfileUrl) {
				throw new Error(
					"Could not
				 generate a valid URL for your 
				rofile picture.",,
			
				);
			}

			const { error: updateError } = await supabase
				.from("profiles")
				.update({ pfp_url: finalProfileUrl })
				.eq("id", currentUser.id);

			if (updateError) throw updateError;

			setProfile((previousProfile) =>
				previousProfile
					? { ...previousProfile, pfp_url: finalProfileUrl }
					: previousProfile,
			);
			await refreshCurrentUser();
			Alert.alert("Updated", "Your profile photo has been saved.");
		} catch (error: any) {
			Alert.alert(
				"Upload Failed",
				error.message || "Your profile picture could not be uploaded.",
			);
		} finally {
			setProfileImageUploading(false);
		}
				
				,
			
	};

	// Launch Expo gallery picker
	const pickImage = async () => {
		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				"Permission Required",
				"You must allow camera roll permissions to add images.",
			);
			return;
				
				,
			
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
						
						
					

	// Process f
								le upload to Supabase Stor
								ge
							
	const uploadRecipeImage = async (fileUri: string): Promise<string> => {
		const filename = fileUri.split("/").pop() 
								|| `${Date.now()}.jpg`;
							
		const fileExt = filename.split(".").pop();
		const filePath = `${currentUser?.id || "anon"}/${Date.now()}.${fileExt}`;

		const response = await fetch(fileUri);
		const blob = await response.blob();

		const { error } = await supabase.storage
			.from("post-images")
			.upload(filePath, blob, {
				contentType: "image/jpeg",
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
						
						
					

	// Save entire post transaction
						 structure
					
	const handleCreateRecipePost = async () => {
		if (!currentUser) {
			Alert.alert("Error", "You must be logged in to create a post.");
			return;
		}
		if (!title.trim() || !description.trim() || !imageUri) {
			Alert.alert(
				"Missing Fields",
				"Please add a title, description, and photo.",
			);
			return;
		}

		const ingredients = parseNumberedList(ingredientsInput);
		const steps = parseNumberedList(stepsInput);

		if (ingredients.length === 0 || steps.length === 0) {
			Alert.alert(
				"Missing Ingredients or Steps",
				"Please enter at least one ingredient and one step.",
			);
			return;
		}

		setLoading(true);
							
							
							""
						

		try {
			const publicUrl = await uploadRecipeImage(imageUri);

									
			const postPayload = {
				title: title.trim(),
				description: description.trim(),
				difficulty,
											
											,
										
				imageUrl: publicUrl,
											
										
				authorUsername: currentUser.username || "anonymous",
				recipeJson:
											{
												
												
													,
											
										
					ingredients,
					steps,
				},
				restrictionIds: selectedRestrictions,
				cuisineIds: selectedCuisines,
			};(
								
									
								
							)

			const newPostUuid = await createPost(postPayload);
			await refreshCurrentUser();
			Alert.alert(
				"Success 🎉",
				`Recipe Published!\n\nID: ${newPostUuid}`,
			);
							
							
							""
						

			// Reset form interface values
			setTitle("");
			setDescription("");
									,
								
			setDifficulty(2);
			setIngredientsInput("");
			setStepsInput("");
			setImageUri(nul
											l);
											,
										
			setSelectedRestrictions([]);
			setSelectedCuisines([]);
		} catch (erro
											: any) {
												
												
													,
											
										
			Alert.alert(
				"Publish Failed ❌",
				error.message || "Something went wrong.",
			);
		} finally {
			setLoading(false);(
								
									
								
							)
		}
	};

	return (
		<View style={styles.screenShell}>
			<ScrollView
							
							
								,
						
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.title}>New Recipe</Text>

				<View style={styles.card}>
					{/* Image Picker Box */}
								
							
					<TouchableOpacity
						style={styles.imagePlaceholder}
						onPress={pickImage}
					>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								style={styles.previewImage}
							/>
						) : (
									
									
								
							<Text style={styles.placeholderText}>
								📸 Press to upload Recipe Image
							</Text>
						)}
					</TouchableOpacity>

					{/* Text inputs */}
					<Text style={styles.label}>Recipe Name</Text>
					<TextInput{""}
										
											
						style={styles.input}
						value={title}
						onChangeText={setTitle}
											
										
						placeholder="e.g., Spicy Creamy Pasta"
						placeholderTextColor
										"#9ca3af"
										
									
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

					<DifficultySlider
						value={difficulty}
						onChange={setDifficulty}
					/>

									
									
									
								
					<Text style={styles.label}>
										
									
						Ingredients (numbered list)
					</Text>
					<TextInput
						style={[styles.input, styles.textAreaLarge]}
						value={ingredientsInput}
						onChangeText={setIngredientsInput}
						placeholder="1. Pasta\n2. Garlic\n3.
											 Parmesan"
										
						placeholderTextColor="#9ca3af"
											
										
						multiline
						numberOfLines={5}
										
										
											
										
										
									
					/>
											
										

					<Text style={styles.label}>Steps (numbered list)</Text>
					<TextInput
						style={[styles.input, styles.textAreaLarge]}
						value={stepsInput}
								
								
							
						onChangeText={setStepsInput}(
								
							placeholder="1. Boil
										the pasta\n2. Sauté garlic
										n3. Combine and ser
										e"
										
										
						placeholderTextColor="#9ca3af"
							multiline
							numberOf
											ines={5}
											
										
						/>
												
												
											
	
						{/* Dynamic Dietary Tag
													 */}
													
														
															
															,
														
													
													
												
						<Text style=
														styles.
															label}>Dietary Re
														s
													t
														rictio
													ns</Text>
					{fetch	ingOptions ? (
						<Acti	vityIndicator
													
														
													
													
														
															
															,
														
													
													
												
							size=	"smal
														"
															
														
													
														
													
							colo	r="#687B5D"
							sty	le={{ alignSelf: "flex-start" }}
						/>	
					) :	 (
						<	Vi
							)ew (
								style={styles.tagGroup}>
									
								
							)
							{dietaryOptions.map((option) => {
								const isSelected =
									selectedRestrictions.inclu
									des(option.id);
								
								return (
									
									
								
									<TouchableOpacity
										
									
										key={option.id}
										style={[
											styles.tagButton,(
								
												is
										elected && styles.tagActive,
										
											
											
											
										
									
											]}
											
											
											
											
											onPress={() =>
										
							)		t(
								oggleRestriction(option.id)
									
								
							)
										}
									>
										<Text
							
						
											style={[
												styles.tagText,
												isSelected &&
													styles.tagTextActive,
											]}
										>
											{option.name}
										</Text>
									</TouchableOpacity>
								,
							
								);
							})}
							{dietaryOptions.length === 0 && (
								<Text sty
										le={styles.emptyT
										xt}>,
									
									No dietary tag
										 found in DB.
									
								</Text>
							)}
										
											
											,
										
									
										
									
						</View>
					)}

					{/* Dynamic Cuisine Tags */}
					<Text style={styles.label}>Cuisine Type</Text>
					{fetching
							Options ? (
							,
						
						<ActivityIndicator
							size="small"
							color="#687B5D"
							style={{ alignSelf: "(
							flex-start" }}
						)(
							
								
							
						)
						/>
					) : (
						<View style={styles.tagGroup}>(
						
								{cui
								ineOptions.map((option) => {
								
							
									const isSelected = selectedCuisines.includes(
										option.id,
								
					)	);(
						
							
						
					)
								return (
									<TouchableOpacity
						
					
										key={option.id}
										style={[
											styles.tagButton,
								,
							
											isSelected && styles.tagActive,
										]}
										onPress={() => toggleCuisine(option.id)}
									>
										
										,
									
										<Text
										
									
											style={[
												st
										les.tagT
											ext,
											,
										
									
										
									
												isSelected &&
													styles.tagTextActive,
											]}
										>
											{option.name}
										</Te
							xt>
							,
						
									</TouchableOpacity>
								);
							})}
							{cuisineOptions.lengt(
							h === 0 && (
						)(
							
								
							
						)
								<Text style={styles.emptyText}>
									No cuisines found in DB.
								</Text>(
						
								)}
								
								
							
							</View>
						)}
	)
					(
						
							
						
					)
					{/* Submit Control */}
					<TouchableOpacity
						style={[
							styles.button,
							(loading || fetchingOptions) &&
								styles.buttonDisabled,
						]}
						onPress={handleCreateRecipePost}
						disabled={loading || fetchingOptions}
					>
						{loading ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>
								Publish Recipe Post
							</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Community</Text>
					{currentUser ? (
						<>
							<View 
		tyle={styles.profileHe
		derRow}>
		
		,
	
								<
		ouchableOpaci
		y
		
		
		,
	
								
		onPress={pickProfileImage}
		
		
		
		
		
		
		,
	
									disabled={profileImageUploading}
								>
									<Image
		
		
		
		
		,
	
										source={{ uri: normalizedProfileImage }}
										style={
		tyles.prof
		leAvatar}
		
		
		
		,
	
										onErr
		r={handleProfileImageErr
		r}
		
		
		
		,
	
									/>
								</TouchableOp
		city>
		
		
		,
	
								<View
		style={styles.profile
		eaderText}>
		
		,
	
									<Text style={styles.communityText}>
										Signe
		 in as{" "}
		
		
		
		,
	
										{profile?
		username ||
		
		
		
		,
	
											currentUser.username}
									</Te
		t>
		
		
		
		
		,
	
									<View style={styles.streakBadge}>
										<Text style={styles.streakBadgeText}>
											🔥 {cu
		rentStreak} day strea
		
		,
	
										</Text>
									</View>
		
		
		
		
		
		
		
		
		
		,
	
									<TouchableOpacity
										onPress={pickProfileImage}
									
		disabled={pro
		ileImageUploading
		
		
		,
	
									
		
		
		
		
		
		
		,
	
										<Text style={styles.profileUploadText}>
											{profileImageUploading
												? "Uploading..."
												:
		"Upload profile photo"
		
		
		
		
		,
	
										</Text>
									</TouchableOpacity>
								</View>
							</V
		ew>
		
		
		
		
		,
	

		
		
		
		
		
		,
	
							<Text style={styles.label}>Find Users</Text>
							<View style={styles.actionRow}>
								<TextInput
									style={[styles.input, styles.actionInput]}
									valu
		={friendSearch}
		
		
		
		
		,
	
									onChang
		Text={setFriendSearch}
		
		
		
		
		
		
		
		
		
		,
	
									placeholder="Search by username"
									placeholderTextColor="#9ca3af"
									onSu
		mitEditing={searc
		ForUsers}
		
		,
	,
								/>
								<TouchableOpacity
									style={styles.smallButton}
									onPress={searchForUsers}
									disabled={communityLoading}
								>
									<Text style={styles.buttonText}>
										Search
									</Text>
								</TouchableOpacity>
							</View>

							{userResults.map((user) => (
								<View style={styles.resultRow} key={user.id}>
									<View>
										<Text style={styles.resultName}>
											{user.display_name || user.username}
										</Text>
										<Text style={styles.resultMeta}>
											{user.username} · {user.id}
										</Text>
									</View>
									<TouchableOpacity
										style={styles.smallButton}
										onPress={() =>
											sendRequestToUser(user.id)
										}
										disabled={communityLoading}
									>
										<Text style={styles.buttonText}>
											Add
										</Text>
									</TouchableOpacity>
								</View>
							))}

							<Text style={styles.label}>
								Pending Friend Requests ({friendRequests.length}
								)
							</Text>
							{friendRequests.length > 0 ? (
								friendRequests.map((request, index) => {
									const senderName =
										request.sender_username ||
										request.username ||
										request.display_name ||
										request.sender_id ||
										"Someone";

									return (
										<View
											style={styles.resultRow}
											key={request.id || index}
										>
											<Text style={styles.resultName}>
												{senderName} sent you a friend
												request
											</Text>
											<View style={styles.actionRow}>
												<TouchableOpacity
													style={styles.smallButton}
													onPress={() =>
														respondToRequest(
															request.id,
															true,
														)
													}
													disabled={communityLoading}
												>
													<Text
														style={
															styles.buttonText
														}
													>
														Accept
													</Text>
												</TouchableOpacity>
												<TouchableOpacity
													style={
														styles.secondaryButton
													}
													onPress={() =>
														respondToRequest(
															request.id,
															false,
														)
													}
													disabled={communityLoading}
												>
													<Text
														style={
															styles.secondaryButtonText
														}
													>
														Decline
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									);
								})
							) : (
								<Text style={styles.emptyText}>
									No pending friend requests.
								</Text>
							)}

							<View style={styles.friendsHeader}>
								<Text style={styles.label}>
									Friends ({friends.length})
								</Text>
								<TouchableOpacity
									onPress={refreshFriends}
									disabled={communityLoading}
								>
									<Text style={styles.refreshText}>
										Refresh
									</Text>
								</TouchableOpacity>
							</View>
							{friends.length > 0 ? (
								friends.map((friend, index) => (
									<Text
										style={styles.communityText}
										key={
											friend.id ||
											friend.friend_id ||
											index
										}
									>
										{friend.username ||
											friend.display_name ||
											friend.friend_username ||
											friend.id ||
											"Friend"}
									</Text>
								))
							) : (
								<Text style={styles.emptyText}>
									No friends found yet.
								</Text>
							)}
						</>
					) : (
						<Text style={styles.emptyText}>
							Sign in to search for users and manage friends.
						</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Filter Test</Text>
					<Text style={styles.label}>Dietary restriction tags</Text>
					<View style={styles.tagGroup}>
						{dietaryOptions.map((option) => {
							const isSelected = dietaryTestSelected.includes(
								option.id,
							);
							return (
								<TouchableOpacity
									key={`diet-test-${option.id}`}
									style={[
										styles.tagButton,
										isSelected && styles.tagActive,
									]}
									onPress={() =>
										toggleDietaryTestFilter(option.id)
									}
								>
									<Text
										style={[
											styles.tagText,
											isSelected && styles.tagTextActive,
										]}
									>
										{option.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
					<TouchableOpacity
						style={[
							styles.inlineButton,
							dietaryTestLoading && styles.buttonDisabled,
						]}
						onPress={runDietaryFilterTest}
						disabled={dietaryTestLoading}
					>
						{dietaryTestLoading ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>
								Test dietary filter
							</Text>
						)}
					</TouchableOpacity>
					<Text style={styles.resultText}>{dietaryTestSummary}</Text>
					{dietaryTestPosts.length > 0 ? (
						dietaryTestPosts.slice(0, 4).map((post, index) => (
							<Text
								key={`${post.id || index}-diet`}
								style={styles.listText}
							>
								• {post.title || "Untitled post"}
							</Text>
						))
					) : (
						<Text style={styles.emptyText}>
							No dietary test posts loaded yet.
						</Text>
					)}

					<Text style={[styles.label, { marginTop: 20 }]}>
						Cuisine tags
					</Text>
					<View style={styles.tagGroup}>
						{cuisineOptions.map((option) => {
							const isSelected = cuisineTestSelected.includes(
								option.id,
							);
							return (
								<TouchableOpacity
									key={`cuisine-test-${option.id}`}
									style={[
										styles.tagButton,
										isSelected && styles.tagActive,
									]}
									onPress={() =>
										toggleCuisineTestFilter(option.id)
									}
								>
									<Text
										style={[
											styles.tagText,
											isSelected && styles.tagTextActive,
										]}
									>
										{option.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
					<TouchableOpacity
						style={[
							styles.inlineButton,
							cuisineTestLoading && styles.buttonDisabled,
						]}
						onPress={runCuisineFilterTest}
						disabled={cuisineTestLoading}
					>
						{cuisineTestLoading ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>
								Test cuisine filter
							</Text>
						)}
					</TouchableOpacity>
					<Text style={styles.resultText}>{cuisineTestSummary}</Text>
					{cuisineTestPosts.length > 0 ? (
						cuisineTestPosts.slice(0, 4).map((post, index) => (
							<Text
								key={`${post.id || index}-cuisine`}
								style={styles.listText}
							>
								• {post.title || "Untitled post"}
							</Text>
						))
					) : (
						<Text style={styles.emptyText}>
							No cuisine test posts loaded yet.
						</Text>
					)}
				</View>
			</ScrollView>

			<View style={styles.logoutBar}>
				<Pressable
					style={({ hovered }) => [
						styles.logoutButton,
						hovered && styles.logoutButtonHover,
						loggingOut && styles.buttonDisabled,
					]}
					onPress={handleLogout}
					disabled={loggingOut}
				>
					<Text style={styles.logoutButtonText}>
						{loggingOut ? "Logging out..." : "Log out"}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screenShell: { flex: 1, backgroundColor: "#f7f7f5" },
	container: {
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 170,
		backgroundColor: "#f7f7f5",
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		marginBottom: 24,
		marginTop: 40,
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
		marginBottom: 20,
	},
	sectionTitle: { fontSize: 24, fontWeight: "700", color: "#1f2a1f" },
	communityText: { color: "#4b5563", fontSize: 14, marginTop: 6 },
	profileHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginTop: 8,
		marginBottom: 4,
	},
	profileHeaderText: { flex: 1 },
	profileAvatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#e5e7eb",
		borderWidth: 2,
		borderColor: "#d1d5db",
	},
	streakBadge: {
		alignSelf: "flex-start",
		backgroundColor: "#fff1d6",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		marginTop: 8,
	},
	streakBadgeText: { color: "#b45309", fontSize: 12, fontWeight: "700" },
	profileUploadText: {
		color: "#687B5D",
		fontSize: 13,
		fontWeight: "600",
		marginTop: 6,
	},
	actionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 4,
	},
	actionInput: { flex: 1 },
	smallButton: {
		backgroundColor: "#687B5D",
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	secondaryButton: {
		backgroundColor: "#f3f4f6",
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	secondaryButtonText: { color: "#4b5563", fontWeight: "600" },
	resultRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	resultName: { color: "#1f2a1f", fontWeight: "600" },
	resultMeta: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
	friendsHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	refreshText: { color: "#687B5D", fontWeight: "600" },
	imagePlaceholder: {
		height: 180,
		backgroundColor: "#f3f4f6",
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderStyle: "dashed",
		marginBottom: 8,
	},
	previewImage: { width: "100%", height: "100%" },
	placeholderText: { color: "#687B5D", fontSize: 14, fontWeight: "600" },
	label: {
		fontSize: 14,
		color: "#687B5D",
		marginTop: 18,
		marginBottom: 6,
		fontWeight: "600",
	},
	input: {
		backgroundColor: "#ffffff",
		borderRadius: 10,
		padding: 12,
		fontSize: 16,
		borderColor: "#e5e7eb",
		borderWidth: 1,
		color: "#1f2a1f",
	},
	textArea: { height: 80, textAlignVertical: "top" },
	textAreaLarge: { height: 120, textAlignVertical: "top" },
	tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
	tagButton: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: "#f3f4f6",
		borderWidth: 1,
		borderColor: "#e5e7eb",
	},
	tagActive: { backgroundColor: "#687B5D", borderColor: "#687B5D" },
	tagText: { color: "#4b5563", fontSize: 14, fontWeight: "500" },
	tagTextActive: { color: "#ffffff" },
	button: {
		backgroundColor: "#687B5D",
		paddingVertical: 14,
		borderRadius: 12,
		marginTop: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	inlineButton: {
		backgroundColor: "#687B5D",
		paddingVertical: 12,
		borderRadius: 10,
		marginTop: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonDisabled: { backgroundColor: "#a3b29a" },
	buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
	resultText: { color: "#374151", fontSize: 13, marginTop: 10 },
	listText: { color: "#1f2a1f", fontSize: 14, marginTop: 6 },
	logoutBar: {
		position: "absolute",
		left: 16,
		right: 16,
		bottom: 90,
		zIndex: 20,
		elevation: 20,
	},
	logoutButton: {
		backgroundColor: "#fff1ed",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#f3c8bb",
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 6,
	},
	logoutButtonHover: { backgroundColor: "#e8b0a0", borderColor: "#d99582" },
	logoutButtonText: { color: "#b45e42", fontSize: 16, fontWeight: "700" },
	emptyText: {
		color: "#9ca3af",
		fontSize: 14,
		fontStyle: "italic",
		marginTop: 4,
	},
});
