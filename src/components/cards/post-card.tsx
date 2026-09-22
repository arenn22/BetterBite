import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import { AppTheme } from "@/constants/app-theme";
import { resolvePostImageUrl } from "@/hooks/use-post-feed";
import { useAuthContext } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { createCookedPostAndReview, fetchUserProfile, get_cooked_posts, get_post_reviews, likePost } from "@/services/api";

import { BaseCard } from "./base-card";

export type PostCardProps = {
	username: string;
	initials: string;
	profilePictureUrl?: string | null;
	meal: string;
	description: string;
	imageUrl: string;
	postId?: string;
	likeCount?: number;
	timeAgo: string;
	tag: string;
	difficulty?: number;
	recipe?: Record<string, unknown>;
};

export function PostCard({
	username,
	initials,
	profilePictureUrl,
	meal,
	description,
	imageUrl,
	postId,
	likeCount = 0,
	timeAgo,
	tag,
	difficulty = 1,
	recipe,
}: PostCardProps) {
	const [detailsVisible, setDetailsVisible] = useState(false);
	const [imageFailed, setImageFailed] = useState(false);
	const [authorImageFailed, setAuthorImageFailed] = useState(false);
	const [liked, setLiked] = useState(false);
	const [likeTotal, setLikeTotal] = useState(likeCount);
	const [liking, setLiking] = useState(false);
	const [cookVisible, setCookVisible] = useState(false);
	const [cookedImage, setCookedImage] = useState<string | null>(null);
	const [cookReview, setCookReview] = useState("");
	const [cookRating, setCookRating] = useState(0);
	const [submittingCook, setSubmittingCook] = useState(false);
	const [resolvedImageUrl, setResolvedImageUrl] = useState<string>(imageUrl || "");
	const [reviews, setReviews] = useState<Array<{
		id: string;
		authorUsername: string;
		authorPfpUrl?: string | null;
		rating: number;
		description: string;
		imageUrl?: string | null;
	}>>([]);
	const [loadingReviews, setLoadingReviews] = useState(false);
	const { currentUser } = useAuthContext();
	const ingredients = getRecipeList(recipe?.ingredients);
	const steps = getRecipeList(recipe?.steps);
	const hasImage = Boolean(resolvedImageUrl?.trim()) && !imageFailed;
	const hasAuthorImage = Boolean(profilePictureUrl?.trim()) && !authorImageFailed;

	useEffect(() => {
		let active = true;
		async function resolveImage() {
			const nextUrl = await resolvePostImageUrl(imageUrl);
			if (!active) return;
			setResolvedImageUrl(nextUrl || imageUrl || "");
		}
		void resolveImage();
		return () => {
			active = false;
		};
	}, [imageUrl]);

	useEffect(() => {
		const currentPostId = postId;
		if (!detailsVisible || typeof currentPostId !== "string" || !currentPostId.trim()) {
			setReviews([]);
			setLoadingReviews(false);
			return;
		}
		const safePostId = currentPostId.trim();

		let active = true;

		async function loadReviews() {
			setLoadingReviews(true);
			try {
				const [reviewData, cookedPostsData] = await Promise.all([
					get_post_reviews(safePostId),
					get_cooked_posts(),
				]);
				if (!active) return;

				const cookedPostsByProfileId = new Map<string, any>();
				for (const cookedPost of (cookedPostsData || []) as any[]) {
					const sourceId = cookedPost?.source_post_id ?? cookedPost?.post_id ?? cookedPost?.recipe_post_id ?? cookedPost?.sourcePostId;
					if (sourceId !== safePostId || !cookedPost?.profile_id) {
						continue;
					}
					cookedPostsByProfileId.set(String(cookedPost.profile_id), cookedPost);
				}

				const uniqueProfileIds = Array.from(new Set((reviewData || [])
					.map((review: any) => String(review?.profile_id || ""))
					.filter(Boolean)
					.filter((profileId) => cookedPostsByProfileId.has(profileId))));

				const profileMap = new Map<string, any>();
				const profileResults = await Promise.all(
					uniqueProfileIds.map(async (profileId) => {
						const profile = await fetchUserProfile(profileId);
						if (profile) {
							profileMap.set(profileId, profile);
						}
					})
				);
				void profileResults;

				const normalizedReviews = await Promise.all((reviewData || [])
					.filter((review: any) => review?.profile_id && cookedPostsByProfileId.has(String(review.profile_id)))
					.map(async (review: any) => {
						const cookedPost = cookedPostsByProfileId.get(String(review.profile_id));
						const profile = profileMap.get(String(review.profile_id));
						const rawImage =
							cookedPost?.cooked_image_url ??
							cookedPost?.cooked_image_path ??
							cookedPost?.image_url ??
							cookedPost?.photo_url ??
							review?.cooked_image_url ??
							review?.cooked_image_path ??
							review?.image_url ??
							review?.review_image_url ??
							review?.photo_url ??
							null;
						const resolvedImage = rawImage ? await resolvePostImageUrl(rawImage as string, "cooked_posts-images") : null;
						const authorUsername =
							profile?.username ??
							cookedPost?.author_username ??
							cookedPost?.username ??
							review?.author_username ??
							review?.username ??
							review?.profile_username ??
							review?.user_name ??
							"User";
						const authorPfpUrl =
							profile?.pfp_url ??
							cookedPost?.author_pfp_url ??
							cookedPost?.pfp_url ??
							cookedPost?.profile_pfp_url ??
							review?.author_pfp_url ??
							review?.pfp_url ??
							review?.profile_pfp_url ??
							null;

						return {
							id: String(review?.id ?? cookedPost?.id ?? `${safePostId}-${Math.random()}`),
							authorUsername: String(authorUsername),
							authorPfpUrl,
							rating: Number(review?.rating ?? 0),
							description: String(review?.description ?? review?.review_description ?? review?.text ?? ""),
							imageUrl: resolvedImage,
						};
					}));

				setReviews(normalizedReviews);
			} catch (error) {
				console.error("Error loading post reviews:", error);
				if (active) setReviews([]);
			} finally {
				if (active) setLoadingReviews(false);
			}
		}

		loadReviews();
		return () => {
			active = false;
		};
	}, [detailsVisible, postId]);

	async function toggleLike() {
		if (!postId || liked || liking) return;
		setLiking(true);
		try {
			await likePost(postId, currentUser?.id || "");
			setLiked(true);
			setLikeTotal((count) => count + 1);
		} finally {
			setLiking(false);
		}
	}

	async function chooseCookedImage() {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert("Permission required", "Allow photo access to add your cooked recipe image.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]?.uri) setCookedImage(result.assets[0].uri);
	}

	async function submitCookedRecipe() {
		if (!postId) {
			Alert.alert("Unable to save", "This recipe is missing its post ID.");
			return;
		}
		if (!currentUser?.id) {
			Alert.alert("Sign in required", "Please sign in before saving a cooked recipe.");
			return;
		}
		if (!cookedImage) {
			Alert.alert("Missing photo", "Upload a photo of your cooked recipe before saving.");
			return;
		}

		setSubmittingCook(true);
		try {
			const file = await (await fetch(cookedImage)).blob();
			const filePath = `${currentUser.id}/${postId}/${crypto.randomUUID()}-${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage
				.from("cooked_posts-images")
				.upload(filePath, file, {
					contentType: file.type || "image/jpeg",
					upsert: false,
				});

			if (uploadError) {
				throw new Error(`Image upload failed: ${uploadError.message}`);
			}

			const publicUrl = supabase.storage
				.from("cooked_posts-images")
				.getPublicUrl(filePath).data.publicUrl;

			const trimmedReview = cookReview.trim();
			await createCookedPostAndReview(supabase, {
				profile_id: currentUser.id,
				post_id: postId,
				image_url: publicUrl,
				rating: cookRating,
				description: trimmedReview,
			});

			setCookVisible(false);
			setCookedImage(null);
			setCookReview("");
			setCookRating(0);
			Alert.alert("Saved", "Your cooked recipe has been added to your profile.");
		} catch (error) {
			console.error("submitCookedRecipe failed:", error);
			Alert.alert(
				"Could not save cooked recipe",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setSubmittingCook(false);
		}
	}

	return (
		<>
			<Pressable onPress={() => setDetailsVisible(true)}>
				<BaseCard style={styles.card}>
					{hasImage ? (
						<Image
							source={{ uri: resolvedImageUrl }}
							style={styles.image}
								resizeMode="cover"
								onError={() => setImageFailed(true)}
						/>
					) : (
						<View style={styles.imageFallback}>
							<Text style={styles.imageFallbackMark}>BB</Text>
							<Text style={styles.imageFallbackText}>Recipe image unavailable</Text>
						</View>
					)}
					<View style={styles.postContent}>
				<View style={styles.authorRow}>
					{hasAuthorImage ? (
						<Image
							accessibilityLabel={`${username}'s profile picture`}
							source={{ uri: profilePictureUrl?.trim() || undefined }}
							style={styles.avatar}
							resizeMode="cover"
							onError={() => setAuthorImageFailed(true)}
						/>
					) : (
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{initials}</Text>
						</View>
					)}
					<View style={styles.authorDetails}>
						<Text style={styles.username}>{username}</Text>
						<Text style={styles.time}>{timeAgo}</Text>
					</View>
					<View style={styles.tag}>
						<Text style={styles.tagText}>{tag}</Text>
					</View>
				</View>
				<Text style={styles.meal} numberOfLines={2}>
					{meal}
				</Text>
				<Text style={styles.description} numberOfLines={2}>
					{description}
				</Text>
					</View>
				</BaseCard>
			</Pressable>
			<Modal
				visible={detailsVisible}
				animationType="slide"
				onRequestClose={() => setDetailsVisible(false)}
			>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<ScrollView showsVerticalScrollIndicator={false}>
							<Pressable
								style={styles.closeButton}
								onPress={() => setDetailsVisible(false)}
							>
								<Text style={styles.closeText}>Close</Text>
							</Pressable>
							<Text style={styles.modalTitle}>{meal}</Text>
							<Text style={styles.modalMeta}>
									{username}  |  Difficulty {difficulty}/10
							</Text>
							{hasImage && <Image source={{ uri: resolvedImageUrl }} style={styles.modalImage} resizeMode="cover" />}
							<View style={styles.engagementRow}>
								<Pressable style={styles.likeButton} onPress={toggleLike} disabled={liking}>
									{liking ? <ActivityIndicator color={AppTheme.accent} /> : <Text style={styles.likeText}>{liked ? "Liked" : "Like"}</Text>}
									<Text style={styles.likeCount}>{likeTotal}</Text>
								</Pressable>
								<Pressable style={styles.cookButton} onPress={() => setCookVisible(true)}>
									<Text style={styles.cookText}>Cook this recipe</Text>
								</Pressable>
							</View>
							<Text style={styles.modalDescription}>{description}</Text>
							<Text style={styles.detailHeading}>Ingredients</Text>
							{ingredients.length ? ingredients.map((item, index) => (
								<Text style={styles.detailItem} key={`${item}-${index}`}>
									- {item}
								</Text>
							)) : <Text style={styles.detailEmpty}>No ingredients listed.</Text>}
							<Text style={styles.detailHeading}>How to cook</Text>
							{steps.length ? steps.map((item, index) => (
								<Text style={styles.detailItem} key={`${item}-${index}`}>
									{index + 1}. {item}
								</Text>
							)) : <Text style={styles.detailEmpty}>No cooking steps listed.</Text>}
							<Text style={styles.detailHeading}>Cooked by</Text>
							{loadingReviews ? (
								<Text style={styles.detailEmpty}>Loading cooked reviews...</Text>
							) : reviews.length ? (
								<View style={styles.reviewList}>
									{reviews.map((review) => (
										<View key={review.id} style={styles.reviewCard}>
											<View style={styles.reviewHeader}>
												{review.authorPfpUrl ? (
													<Image
														source={{ uri: review.authorPfpUrl }}
														style={styles.reviewAvatar}
														resizeMode="cover"
													/>
												) : (
													<View style={styles.reviewAvatarFallback}>
														<Text style={styles.reviewAvatarText}>{review.authorUsername.slice(0, 1).toUpperCase()}</Text>
													</View>
												)}
												<View style={styles.reviewMeta}>
													<Text style={styles.reviewUser}>{review.authorUsername}</Text>
													<Text style={styles.reviewRating}>Rated {review.rating}/5</Text>
												</View>
											</View>
											{review.imageUrl ? (
												<Image
													source={{ uri: review.imageUrl }}
													style={styles.reviewImage}
													resizeMode="cover"
												/>
											) : null}
											{review.description ? (
												<Text style={styles.reviewDescription}>{review.description}</Text>
											) : null}
										</View>
									))}
								</View>
							) : (
								<Text style={styles.detailEmpty}>No cooked recipes are available yet.</Text>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
			<Modal visible={cookVisible} animationType="slide" transparent onRequestClose={() => setCookVisible(false)}>
				<View style={styles.cookBackdrop}>
					<View style={styles.cookCard}>
						<Pressable style={styles.closeButton} onPress={() => setCookVisible(false)}>
							<Text style={styles.closeText}>Close</Text>
						</Pressable>
						<Text style={styles.cookTitle}>Cook {meal}</Text>
						<Pressable style={styles.cookImageBox} onPress={chooseCookedImage}>
							{cookedImage ? <Image source={{ uri: cookedImage }} style={styles.cookedImage} /> : <Text style={styles.detailEmpty}>Upload your cooked recipe photo</Text>}
						</Pressable>
						<Text style={styles.ratingLabel}>Your rating</Text>
						<View style={styles.ratingRow}>
							{[1, 2, 3, 4, 5].map((rating) => (
								<Pressable
									key={rating}
									onPress={() => setCookRating(rating)}
									style={[styles.ratingButton, cookRating === rating && styles.selectedRatingButton]}
								>
									<Text style={[styles.ratingText, cookRating === rating && styles.selectedRating]}>{rating}</Text>
								</Pressable>
							))}
						</View>
						<Text style={styles.reviewLabel}>Review note (optional)</Text>
						<TextInput
							style={styles.reviewInput}
							value={cookReview}
							onChangeText={setCookReview}
							placeholder="Tell everyone how it turned out..."
							placeholderTextColor={AppTheme.muted}
							multiline
							numberOfLines={4}
						/>
						<Pressable
							disabled={submittingCook}
							style={[styles.submitCookButton, submittingCook && styles.submitCookButtonDisabled]}
							onPress={submitCookedRecipe}
						>
							<Text style={styles.submitCookText}>{submittingCook ? "Saving..." : "Save cooked recipe"}</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</>
	);
}

function getRecipeList(value: unknown) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => String(item)).filter(Boolean);
}

const styles = StyleSheet.create({
	card: {
		width: "100%",
		maxWidth: 600,
	},
	image: {
		width: "100%",
		height: 300,
		backgroundColor: AppTheme.accentSoft,
	},
	imageFallback: {
		height: 300,
		backgroundColor: AppTheme.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	imageFallbackMark: { color: AppTheme.accent, fontSize: 30, fontWeight: "700" },
	imageFallbackText: { color: AppTheme.muted, fontSize: 12, marginTop: 6 },
	postContent: {
		padding: 20,
	},
	authorRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppTheme.warmSoft,
	},
	avatarText: {
		color: AppTheme.warm,
		fontSize: 11,
		fontWeight: "800",
	},
	authorDetails: {
		marginLeft: 9,
		flex: 1,
	},
	username: {
		color: AppTheme.text,
		fontSize: 13,
		fontWeight: "700",
	},
	time: {
		color: AppTheme.muted,
		fontSize: 11,
		marginTop: 2,
	},
	tag: {
		backgroundColor: AppTheme.accentSoft,
		borderRadius: 8,
		paddingHorizontal: 9,
		paddingVertical: 5,
	},
	tagText: {
		color: AppTheme.accent,
		fontSize: 10,
		fontWeight: "700",
	},
	meal: {
		color: AppTheme.text,
		fontSize: 24,
		fontWeight: "600",
		marginTop: 16,
	},
	description: {
		color: AppTheme.muted,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 5,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(48, 49, 46, 0.45)",
		justifyContent: "flex-end",
	},
	modalCard: {
		maxHeight: "88%",
		backgroundColor: AppTheme.background,
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		padding: 24,
	},
	modalImage: {
		width: "100%",
		height: 240,
		borderRadius: 10,
		marginTop: 18,
		backgroundColor: AppTheme.accentSoft,
	},
	engagementRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginTop: 16,
	},
	likeButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderWidth: 1,
		borderColor: AppTheme.border,
		borderRadius: 9,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	likeText: { color: AppTheme.accent, fontWeight: "700" },
	likeCount: { color: AppTheme.text, fontWeight: "600" },
	cookButton: {
		flex: 1,
		alignItems: "center",
		backgroundColor: AppTheme.accent,
		borderRadius: 9,
		paddingHorizontal: 12,
		paddingVertical: 11,
	},
	cookText: { color: AppTheme.card, fontWeight: "700" },
	cookBackdrop: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(48, 49, 46, 0.45)",
	},
	cookCard: {
		backgroundColor: AppTheme.background,
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		padding: 24,
	},
	cookTitle: { color: AppTheme.text, fontSize: 22, fontWeight: "700", marginTop: 14 },
	cookImageBox: {
		height: 180,
		marginTop: 18,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: AppTheme.border,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	cookedImage: { width: "100%", height: "100%" },
	ratingLabel: { color: AppTheme.text, fontWeight: "700", marginTop: 18 },
	ratingRow: { flexDirection: "row", gap: 8, marginTop: 10 },
	ratingButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: AppTheme.surface,
		borderWidth: 1,
		borderColor: AppTheme.border,
		alignItems: "center",
		justifyContent: "center",
	},
	selectedRatingButton: {
		backgroundColor: AppTheme.accentSoft,
		borderColor: AppTheme.accent,
	},
	ratingText: { color: AppTheme.muted, fontWeight: "700" },
	selectedRating: { color: AppTheme.accent },
	reviewLabel: { color: AppTheme.text, fontWeight: "700", marginTop: 18 },
	reviewInput: {
		marginTop: 10,
		minHeight: 90,
		borderWidth: 1,
		borderColor: AppTheme.border,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: AppTheme.text,
		backgroundColor: AppTheme.surface,
		textAlignVertical: "top",
	},
	submitCookButton: {
		alignItems: "center",
		backgroundColor: AppTheme.accent,
		borderRadius: 9,
		marginTop: 22,
		paddingVertical: 13,
	},
	submitCookButtonDisabled: {
		opacity: 0.7,
	},
	submitCookText: { color: AppTheme.card, fontWeight: "700" },
	closeButton: { alignSelf: "flex-end", paddingVertical: 4, paddingHorizontal: 2 },
	closeText: { color: AppTheme.accent, fontSize: 14, fontWeight: "700" },
	modalTitle: { color: AppTheme.text, fontSize: 28, fontWeight: "700", marginTop: 12 },
	modalMeta: { color: AppTheme.accent, fontSize: 13, fontWeight: "600", marginTop: 8 },
	modalDescription: { color: AppTheme.muted, fontSize: 15, lineHeight: 23, marginTop: 18 },
	detailHeading: { color: AppTheme.text, fontSize: 18, fontWeight: "700", marginTop: 26, marginBottom: 10 },
	detailItem: { color: AppTheme.text, fontSize: 15, lineHeight: 23, marginBottom: 7 },
	detailEmpty: { color: AppTheme.muted, fontSize: 14 },
	reviewList: { marginTop: 10, gap: 12 },
	reviewCard: {
		backgroundColor: AppTheme.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: AppTheme.border,
		padding: 12,
		gap: 10,
	},
	reviewHeader: { flexDirection: "row", alignItems: "center" },
	reviewAvatar: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: AppTheme.accentSoft,
	},
	reviewAvatarFallback: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: AppTheme.warmSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	reviewAvatarText: { color: AppTheme.warm, fontWeight: "700" },
	reviewMeta: { marginLeft: 10, flex: 1 },
	reviewUser: { color: AppTheme.text, fontWeight: "700" },
	reviewRating: { color: AppTheme.accent, fontSize: 12, marginTop: 2 },
	reviewImage: {
		width: "100%",
		height: 180,
		borderRadius: 10,
		backgroundColor: AppTheme.accentSoft,
	},
	reviewDescription: {
		color: AppTheme.text,
		fontSize: 14,
		lineHeight: 20,
	},
});
