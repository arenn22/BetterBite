import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
    createCookedPost,
    createPostReview,
    fetchPostEngagement,
    getCookedPostXp,
    uploadCookedPostImage,
    type CookedPhotoWithAuthor,
    type PostReviewWithAuthor,
} from "@/services/api/cooked-posts";
import type { Post } from "@/types/models";

type CommunityTab = "cooks" | "reviews";

type RecipeDetailsModalProps = {
  post: Post | null;
  visible: boolean;
  difficulty: string;
  cookingTime?: string;
  likes: number;
  views: number;
  liked: boolean;
  likeLoading: boolean;
  onClose: () => void;
  onLike: (currentlyLiked: boolean) => Promise<void>;
};

function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text = record.text ?? record.name ?? record.description ?? record.step;
      if (typeof text === "string" && text.trim()) return [text.trim()];
    }
    return [];
  });
}

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function StarRating({ value, onChange }: { value: number; onChange?: (rating: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <Pressable
          key={rating}
          disabled={!onChange}
          onPress={() => onChange?.(rating)}
          accessibilityRole={onChange ? "button" : undefined}
          accessibilityLabel={onChange ? `${rating} star${rating === 1 ? "" : "s"}` : undefined}
          style={({ pressed }) => [pressed && onChange ? styles.starPressed : null]}
        >
          <Text style={[styles.star, rating <= value ? styles.starSelected : styles.starMuted]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export function RecipeDetailsModal({
  post,
  visible,
  difficulty,
  cookingTime,
  likes,
  views,
  liked,
  likeLoading,
  onClose,
  onLike,
}: RecipeDetailsModalProps) {
  const { currentUser } = useAuthContext();
  const [communityTab, setCommunityTab] = useState<CommunityTab>("cooks");
  const [reviews, setReviews] = useState<PostReviewWithAuthor[]>([]);
  const [cookedPhotos, setCookedPhotos] = useState<CookedPhotoWithAuthor[]>([]);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [cookImageUri, setCookImageUri] = useState<string | null>(null);
  const [cookSaving, setCookSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !post) return;
    let isActive = true;
    setCommunityTab("cooks");
    setCookImageUri(null);
    setActionError(null);
    setActionMessage(null);
    setImageFailed(false);
    setEngagementLoading(true);

    void fetchPostEngagement(post.id)
      .then((engagement) => {
        if (!isActive) return;
        setReviews(engagement.reviews);
        setCookedPhotos(engagement.cookedPhotos);
      })
      .catch((error) => {
        if (isActive) {
          setReviews([]);
          setCookedPhotos([]);
          setActionError(error instanceof Error ? error.message : "Could not load community activity.");
        }
      })
      .finally(() => {
        if (isActive) setEngagementLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [post?.id, visible]);

  if (!post) return null;

  const recipeData = post.recipe && typeof post.recipe === "object" ? post.recipe : {};
  const ingredients = asTextList(recipeData.ingredients);
  const steps = asTextList(recipeData.steps);
  const authorName = post.author_username || "BetterBite member";
  const hasCooked = Boolean(currentUser && cookedPhotos.some((photo) => photo.profile_id === currentUser.id));
  const cookPhotoCount = cookedPhotos.length;
  const canSubmitReview = hasCooked && reviewRating > 0 && reviewText.trim().length > 2 && !reviewSaving;
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : null;
  const cookedPhotosByProfile = new Map<string, CookedPhotoWithAuthor[]>();
  for (const photo of cookedPhotos) {
    const authoredPhotos = cookedPhotosByProfile.get(photo.profile_id) ?? [];
    authoredPhotos.push(photo);
    cookedPhotosByProfile.set(photo.profile_id, authoredPhotos);
  }
  for (const authoredPhotos of cookedPhotosByProfile.values()) {
    authoredPhotos.sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  }

  const getReviewCookPhoto = (review: PostReviewWithAuthor) => {
    const authoredPhotos = cookedPhotosByProfile.get(review.profile_id) ?? [];
    const reviewTime = new Date(review.created_at).getTime();
    return authoredPhotos.find((photo) => new Date(photo.created_at).getTime() <= reviewTime) ?? authoredPhotos[0];
  };

  const chooseCookPhoto = async () => {
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (!result.canceled && result.assets[0]) setCookImageUri(result.assets[0].uri);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not open your photo library.");
    }
  };

  const shareCook = async () => {
    if (!currentUser || !cookImageUri) return;
    setCookSaving(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const imagePath = await uploadCookedPostImage(cookImageUri, currentUser.id, post.id);
      const cookedPostId = await createCookedPost({
        profile_id: currentUser.id,
        post_id: post.id,
        cooked_image_path: imagePath,
      });
      setCookImageUri(null);

      let successMessage = "Your cook photo has been shared.";
      let followUpError: string | null = null;
      try {
        const xp = await getCookedPostXp(cookedPostId);
        successMessage = xp === null
          ? "Your cook photo has been shared. No XP award was recorded."
          : `Your cook photo has been shared. You earned ${xp} XP!`;
      } catch (error) {
        followUpError = error instanceof Error ? error.message : "Could not load the XP award.";
      }

      try {
        const engagement = await fetchPostEngagement(post.id);
        setCookedPhotos(engagement.cookedPhotos);
        setReviews(engagement.reviews);
      } catch (error) {
        followUpError = [
          followUpError,
          error instanceof Error ? error.message : "Could not refresh community activity.",
        ].filter(Boolean).join(" ");
      }

      setActionMessage(successMessage);
      if (followUpError) {
        setActionError(`Your cook photo was shared, but follow-up details could not be loaded: ${followUpError}`);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not share your cook photo.");
    } finally {
      setCookSaving(false);
    }
  };

  const submitReview = async () => {
    if (!currentUser || !canSubmitReview) return;
    setReviewSaving(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await createPostReview({
        post_id: post.id,
        rating: reviewRating,
        description: reviewText.trim(),
      });
      const engagement = await fetchPostEngagement(post.id);
      setReviews(engagement.reviews);
      setCookedPhotos(engagement.cookedPhotos);
      setReviewRating(0);
      setReviewText("");
      setActionMessage("Your review has been posted.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not post your review.");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleLike = async () => {
    setActionError(null);
    try {
      await onLike(liked);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update this like.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close recipe details"
        />
        <KeyboardAvoidingView style={styles.sheetFrame} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.detailCard, shadowSm]}>
            <View style={styles.dragHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.detailHero}>
                {post.image_url && !imageFailed ? (
                  <Image source={{ uri: post.image_url }} style={styles.fill} resizeMode="cover" onError={() => setImageFailed(true)} />
                ) : (
                  <View style={[styles.fill, styles.heroFallback]}>
                    <Text style={styles.heroFallbackText}>Image unavailable</Text>
                  </View>
                )}
                <View style={styles.heroShade} />
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close recipe details">
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyBadgeText}>{difficulty}</Text>
                </View>
                <Pressable
                  onPress={() => void handleLike()}
                  disabled={likeLoading}
                  style={[styles.likeButton, liked && styles.likeButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={liked ? `Unlike post, ${likes} likes` : `Like post, ${likes} likes`}
                  accessibilityState={{ disabled: likeLoading }}
                >
                  <Text style={styles.likeIcon}>{liked ? "♥" : "♡"}</Text>
                  <Text style={styles.likeCount}>{likes.toLocaleString()}</Text>
                </Pressable>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{post.title || "Untitled recipe"}</Text>
                <View style={styles.authorRow}>
                  {post.author_pfp_url ? (
                    <Image source={{ uri: post.author_pfp_url }} style={styles.authorAvatar} />
                  ) : (
                    <View style={[styles.authorAvatar, styles.authorInitials]}>
                      <Text style={styles.authorInitialsText}>{authorName.slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.authorName}>by {authorName}</Text>
                  {averageRating !== null ? (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <Text style={styles.averageRating}>★ {averageRating.toFixed(1)} ({reviews.length})</Text>
                    </>
                  ) : null}
                  <Text style={styles.metaDivider}>·</Text>
                  {cookingTime ? <Text style={styles.authorName}>{cookingTime}</Text> : null}
                  <Text style={styles.metaDivider}>·</Text>
                  <Text style={styles.authorName}>{views.toLocaleString()} views</Text>
                </View>
                {post.description?.trim() ? <Text style={styles.description}>{post.description.trim()}</Text> : null}

                {ingredients.length > 0 ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ingredients</Text>
                    {ingredients.map((ingredient, index) => (
                      <View key={`${index}-${ingredient}`} style={styles.listRow}>
                        <View style={styles.listBullet} />
                        <Text style={styles.listText}>{ingredient}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {steps.length > 0 ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Method</Text>
                    {steps.map((step, index) => (
                      <View key={`${index}-${step}`} style={styles.stepRow}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                        <Text style={styles.listText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.communitySection}>
                  <View style={styles.communityTabs}>
                    {(["cooks", "reviews"] as const).map((tab) => {
                      const active = communityTab === tab;
                      const count = tab === "cooks" ? cookPhotoCount : reviews.length;
                      return (
                        <Pressable key={tab} onPress={() => setCommunityTab(tab)} style={[styles.communityTab, active && styles.communityTabActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                          <Text style={[styles.communityTabText, active && styles.communityTabTextActive]}>
                            {tab === "cooks" ? "Cooked photos" : "Reviews"}{count > 0 ? `  ${count}` : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
                  {actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}

                  {communityTab === "cooks" ? (
                    <View>
                      {currentUser ? (
                        <View style={styles.cookPanel}>
                          <Text style={styles.cookPanelTitle}>Cook & share</Text>
                          <Text style={styles.cookPanelSub}>Add a photo of your version to the community.</Text>
                          {cookImageUri ? (
                            <Image source={{ uri: cookImageUri }} style={styles.cookPreview} resizeMode="cover" />
                          ) : null}
                          <View style={styles.cookActions}>
                            <Pressable onPress={() => void chooseCookPhoto()} style={styles.secondaryButton} accessibilityRole="button">
                              <Text style={styles.secondaryButtonText}>{cookImageUri ? "Choose another photo" : "Choose photo"}</Text>
                            </Pressable>
                            {cookImageUri ? (
                              <Pressable onPress={() => void shareCook()} disabled={cookSaving} style={[styles.primaryButton, cookSaving && styles.buttonDisabled]} accessibilityRole="button" accessibilityState={{ disabled: cookSaving }}>
                                {cookSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Share cook</Text>}
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      {engagementLoading ? <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} /> : cookedPhotos.length ? (
                        <View style={styles.photoGrid}>
                          {cookedPhotos.map((photo, index) => (
                            <View key={photo.id || `${photo.profile_id}-${photo.post_id}-${photo.created_at}-${index}`} style={styles.cookedPhotoItem}>
                              <Image source={{ uri: photo.image_url }} style={styles.cookedPhoto} resizeMode="cover" />
                              <Text numberOfLines={1} style={styles.photoAuthor}>{photo.author_username}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <EmptyState title="No cook photos yet" message="Share your version of this recipe to start the gallery." />
                      )}
                    </View>
                  ) : (
                    <View>
                      {currentUser && hasCooked ? (
                        <View style={styles.reviewForm}>
                          <Text style={styles.reviewFormTitle}>Leave a review</Text>
                          <View style={styles.ratingRow}>
                            <StarRating value={reviewRating} onChange={setReviewRating} />
                            <Text style={styles.ratingLabel}>{reviewRating ? `${reviewRating} / 5` : "Tap to rate"}</Text>
                          </View>
                          <TextInput
                            value={reviewText}
                            onChangeText={setReviewText}
                            placeholder="How did it go? Any tweaks you'd make?"
                            placeholderTextColor={colors.faint}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={styles.reviewInput}
                          />
                          <Pressable onPress={() => void submitReview()} disabled={!canSubmitReview} style={[styles.primaryButton, !canSubmitReview && styles.buttonDisabled]} accessibilityRole="button" accessibilityState={{ disabled: !canSubmitReview }}>
                            {reviewSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Post review</Text>}
                          </Pressable>
                        </View>
                      ) : currentUser ? (
                        <View style={styles.reviewGate}>
                          <Text style={styles.reviewGateTitle}>Cook this recipe to leave a review.</Text>
                          <Text style={styles.reviewGateSub}>Share a cook photo first, then tell the community how it went.</Text>
                          <Pressable onPress={() => setCommunityTab("cooks")} style={styles.secondaryButton} accessibilityRole="button">
                            <Text style={styles.secondaryButtonText}>Share a cook photo</Text>
                          </Pressable>
                        </View>
                      ) : null}

                      {engagementLoading ? <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} /> : reviews.length ? (
                        <View style={styles.reviewList}>
                          {reviews.map((review, index) => (
                            <View key={review.id || `${review.profile_id}-${review.created_at}-${index}`} style={styles.reviewItem}>
                              <View style={styles.reviewHeader}>
                                {review.author_pfp_url ? (
                                  <Image source={{ uri: review.author_pfp_url }} style={styles.reviewAvatar} />
                                ) : (
                                  <View style={[styles.reviewAvatar, styles.authorInitials]}>
                                    <Text style={styles.authorInitialsText}>{review.author_username.slice(0, 1).toUpperCase()}</Text>
                                  </View>
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.reviewAuthor}>{review.author_username}</Text>
                                  <StarRating value={review.rating} />
                                </View>
                                <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                              </View>
                              {review.description ? <Text style={styles.reviewDescription}>{review.description}</Text> : null}
                              {(() => {
                                const cookedPhoto = getReviewCookPhoto(review);
                                return cookedPhoto?.image_url ? (
                                  <View style={styles.reviewCook}>
                                    <Image source={{ uri: cookedPhoto.image_url }} style={styles.reviewCookImage} resizeMode="cover" />
                                    <Text style={styles.reviewCookCaption}>Cooked by {review.author_username}</Text>
                                  </View>
                                ) : null;
                              })()}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <EmptyState title="No reviews yet" message="Cook this recipe and share what you think." />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)" },
  sheetFrame: { width: "100%", maxWidth: 430, maxHeight: "94%" },
  detailCard: { maxHeight: "100%", overflow: "hidden", borderRadius: 20, backgroundColor: colors.bg },
  dragHandle: { alignSelf: "center", width: 40, height: 4, marginTop: 8, marginBottom: 4, borderRadius: 2, backgroundColor: colors.border },
  detailHero: { height: 220, backgroundColor: colors.sageLight, overflow: "hidden" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  heroFallbackText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  closeButton: { position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.48)" },
  closeText: { color: "#fff", fontSize: 24, lineHeight: 27 },
  difficultyBadge: { position: "absolute", top: 12, left: 12, maxWidth: 200, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.94)" },
  difficultyBadgeText: { color: colors.sage, fontSize: 10, fontWeight: "800" },
  likeButton: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.52)" },
  likeButtonActive: { backgroundColor: colors.terracotta },
  likeIcon: { color: "#fff", fontSize: 16, fontWeight: "700" },
  likeCount: { color: "#fff", fontSize: 12, fontWeight: "800" },
  detailContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
  detailTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: colors.ink },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 8 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.sageLight },
  authorInitials: { alignItems: "center", justifyContent: "center", backgroundColor: colors.sage },
  authorInitialsText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  authorName: { color: colors.muted, fontSize: 11, fontWeight: "500" },
  averageRating: { color: colors.terracotta, fontSize: 11, fontWeight: "700" },
  metaDivider: { color: colors.border, fontSize: 14 },
  description: { marginTop: 16, color: colors.ink, fontSize: 13, lineHeight: 20 },
  detailSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  detailSectionTitle: { marginBottom: 12, color: colors.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 9 },
  listBullet: { width: 6, height: 6, marginTop: 6, borderRadius: 3, backgroundColor: colors.clay },
  listText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.sage },
  stepNumberText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  communitySection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  communityTabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: 14 },
  communityTab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  communityTabActive: { borderBottomColor: colors.sage },
  communityTabText: { color: colors.faint, fontSize: 12, fontWeight: "700" },
  communityTabTextActive: { color: colors.ink },
  cookPanel: { padding: 14, borderWidth: 1, borderColor: "#EDD5C4", borderRadius: 14, backgroundColor: "#FDF0EA" },
  cookPanelTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  cookPanelSub: { marginTop: 3, marginBottom: 12, color: colors.muted, fontSize: 10, lineHeight: 15 },
  cookPreview: { width: "100%", height: 132, marginBottom: 10, borderRadius: 10, backgroundColor: colors.cream },
  cookActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.sage },
  primaryButtonText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  secondaryButton: { minHeight: 38, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderStyle: "dashed", borderColor: colors.clay, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.5)" },
  secondaryButtonText: { color: colors.terracotta, fontSize: 11, fontWeight: "800" },
  buttonDisabled: { backgroundColor: colors.ghost },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  cookedPhotoItem: { width: "31%", minWidth: 88 },
  cookedPhoto: { width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: colors.sageLight },
  photoAuthor: { marginTop: 4, color: colors.muted, fontSize: 9, fontWeight: "600" },
  reviewForm: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: "#fff" },
  reviewFormTitle: { marginBottom: 10, color: colors.ink, fontSize: 12, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { fontSize: 19, lineHeight: 22 },
  starSelected: { color: colors.clay },
  starMuted: { color: colors.border },
  starPressed: { transform: [{ scale: 1.15 }] },
  ratingLabel: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  reviewInput: { minHeight: 88, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.bg, color: colors.ink, fontSize: 12, lineHeight: 18 },
  reviewGate: { gap: 8, padding: 14, borderRadius: 12, backgroundColor: colors.sageLight },
  reviewGateTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  reviewGateSub: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  reviewList: { gap: 10, marginTop: 14 },
  reviewItem: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: "#fff" },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sageLight },
  reviewAuthor: { marginBottom: 2, color: colors.ink, fontSize: 11, fontWeight: "700" },
  reviewDate: { color: colors.faint, fontSize: 9 },
  reviewDescription: { marginTop: 8, color: colors.ink, fontSize: 11, lineHeight: 17 },
  reviewCook: { marginTop: 10, overflow: "hidden", borderRadius: 10, backgroundColor: colors.sageLight },
  reviewCookImage: { width: "100%", height: 120, backgroundColor: colors.sageLight },
  reviewCookCaption: { paddingHorizontal: 8, paddingVertical: 5, color: colors.muted, fontSize: 9, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.heading, fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptyMessage: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
  actionError: { marginBottom: 10, color: "#B42318", fontSize: 11, lineHeight: 16 },
  actionMessage: { marginBottom: 10, color: colors.sage, fontSize: 11, fontWeight: "700" },
});