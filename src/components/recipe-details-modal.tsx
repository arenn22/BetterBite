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

import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";

import { colors, fonts, radii, shadowLg } from "@/app/(tabs)/theme";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { TagChip } from "@/components/ui/tag-chip";
import type { TagKind } from "@/constants/tag-icons";
import { useAuthContext } from "@/lib/auth/auth-context";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
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
  onAuthorPress?: () => void;
  onDelete?: () => void;
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

function StarRating({ value, onChange, size = 20 }: { value: number; onChange?: (rating: number) => void; size?: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const star = <AppIcon name="star" size={size} color={rating <= value ? colors.gold : colors.border} />;
        return onChange ? (
          <PressableScale
            key={rating}
            onPress={() => onChange(rating)}
            pressScale={0.8}
            hoverScale={1.15}
            accessibilityRole="button"
            accessibilityLabel={`${rating} star${rating === 1 ? "" : "s"}`}
          >
            {star}
          </PressableScale>
        ) : (
          <View key={rating}>{star}</View>
        );
      })}
    </View>
  );
}

/** Heart button that pops when a recipe is liked. */
function LikeButton({ liked, likes, loading, onPress }: { liked: boolean; likes: number; loading: boolean; onPress: () => void }) {
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <PressableScale
      onPress={() => {
        if (!liked) pop.value = withSequence(withSpring(1.45, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 300 }));
        onPress();
      }}
      disabled={loading}
      pressScale={0.92}
      style={[styles.likeButton, liked && styles.likeButtonActive]}
      hoverStyle={liked ? styles.likeButtonActiveHover : styles.likeButtonHover}
      accessibilityRole="button"
      accessibilityLabel={liked ? `Unlike post, ${likes} likes` : `Like post, ${likes} likes`}
      accessibilityState={{ disabled: loading }}
    >
      <Animated.View style={popStyle}>
        <AppIcon name={liked ? "heartFill" : "heart"} size={16} color="#fff" weight="semibold" />
      </Animated.View>
      <Text style={styles.likeCount}>{likes.toLocaleString()}</Text>
    </PressableScale>
  );
}

function SectionTitle({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.detailSectionHeader}>
      <AppIcon name={icon} size={13} color={colors.sage} weight="bold" />
      <Text style={styles.detailSectionTitle}>{children}</Text>
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
  onAuthorPress,
  onDelete,
}: RecipeDetailsModalProps) {
  const { currentUser, refreshCurrentUser } = useAuthContext();
  const { dietaryOptions, cuisineOptions } = useRecipeOptions();
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
  const dietaryNames = (post.restrictionIds ?? []).map((id) => dietaryOptions.find((option) => option.id === id)?.name).filter((name): name is string => Boolean(name));
  const cuisineNames = (post.cuisineIds ?? []).map((id) => cuisineOptions.find((option) => option.id === id)?.name).filter((name): name is string => Boolean(name));
  const inferredTagNames = [recipeData.tags, recipeData.dietary, recipeData.dietaryRestrictions, recipeData.cuisine, recipeData.cuisines]
    .flatMap((value) => asTextList(Array.isArray(value) ? value : [value]))
    .filter((name) => name.trim().length > 0);
  const displayTags: { name: string; kind?: TagKind }[] = [];
  const seenTags = new Set<string>();
  const tagGroups: [string[], TagKind | undefined][] = [[dietaryNames, "dietary"], [cuisineNames, "cuisine"], [inferredTagNames, undefined]];
  for (const [names, kind] of tagGroups) {
    for (const name of names) {
      if (seenTags.has(name)) continue;
      seenTags.add(name);
      displayTags.push({ name, kind });
    }
  }
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
      void refreshCurrentUser().catch((error) => console.error("Unable to refresh streak after cooking:", error));
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
          <Animated.View entering={FadeInDown.duration(240)} style={[styles.detailCard, shadowLg]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.detailHero}>
                {post.image_url && !imageFailed ? (
                  <Image source={{ uri: post.image_url }} style={styles.fill} resizeMode="cover" onError={() => setImageFailed(true)} />
                ) : (
                  <View style={[styles.fill, styles.heroFallback]}>
                    <AppIcon name="forkKnife" size={36} color={colors.sageMid} />
                    <Text style={styles.heroFallbackText}>No photo yet</Text>
                  </View>
                )}
                <View style={styles.heroShade} />
                <PressableScale onPress={onClose} style={styles.closeButton} hoverStyle={styles.closeButtonHover} pressScale={0.88} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close recipe details">
                  <AppIcon name="close" size={15} color="#fff" weight="bold" />
                </PressableScale>
                <View style={styles.difficultyBadge}>
                  <AppIcon name="chart" size={11} color={colors.sage} weight="semibold" />
                  <Text numberOfLines={1} style={styles.difficultyBadgeText}>{difficulty}</Text>
                </View>
                <LikeButton liked={liked} likes={likes} loading={likeLoading} onPress={() => void handleLike()} />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{post.title || "Untitled recipe"}</Text>
                {onDelete ? <Button title="Delete recipe" icon="trash" variant="danger" size="sm" onPress={onDelete} style={styles.deleteButton} /> : null}
                <PressableScale onPress={onAuthorPress} disabled={!onAuthorPress} pressScale={0.98} style={styles.authorRow} hoverStyle={styles.authorRowHover} accessibilityRole={onAuthorPress ? "button" : undefined}>
                  {post.author_pfp_url ? (
                    <Image source={{ uri: post.author_pfp_url }} style={styles.authorAvatar} />
                  ) : (
                    <View style={[styles.authorAvatar, styles.authorInitials]}>
                      <Text style={styles.authorInitialsText}>{authorName.slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.authorName}>by <Text style={styles.authorNameStrong}>{authorName}</Text></Text>
                  {onAuthorPress ? <AppIcon name="chevronRight" size={11} color={colors.faint} weight="semibold" /> : null}
                </PressableScale>
                <View style={styles.metaRow}>
                  {averageRating !== null ? (
                    <View style={[styles.metaPill, styles.ratingPill]}>
                      <AppIcon name="star" size={11} color={colors.gold} />
                      <Text style={[styles.metaText, { color: colors.ink }]}>{averageRating.toFixed(1)} ({reviews.length})</Text>
                    </View>
                  ) : null}
                  {cookingTime ? (
                    <View style={styles.metaPill}>
                      <AppIcon name="clock" size={11} color={colors.sage} />
                      <Text style={styles.metaText}>{cookingTime}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaPill}>
                    <AppIcon name="eye" size={11} color={colors.sage} />
                    <Text style={styles.metaText}>{views.toLocaleString()} views</Text>
                  </View>
                </View>
                {post.description?.trim() ? <Text style={styles.description}>{post.description.trim()}</Text> : null}

                {displayTags.length > 0 ? (
                  <View style={styles.detailSection}>
                    <SectionTitle icon="tag">Tags</SectionTitle>
                    <View style={styles.tagRow}>
                      {displayTags.map((tag) => (
                        <TagChip key={tag.name} label={tag.name} kind={tag.kind} icon={tag.kind ? undefined : "tag"} size="sm" />
                      ))}
                    </View>
                  </View>
                ) : null}

                {ingredients.length > 0 ? (
                  <View style={styles.detailSection}>
                    <SectionTitle icon="list">Ingredients</SectionTitle>
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
                    <SectionTitle icon="numberedList">Method</SectionTitle>
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
                        <PressableScale key={tab} onPress={() => setCommunityTab(tab)} pressScale={0.97} style={[styles.communityTab, active && styles.communityTabActive]} hoverStyle={active ? null : styles.communityTabHover} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                          <AppIcon name={tab === "cooks" ? "camera" : "star"} size={13} color={active ? colors.sage : colors.faint} />
                          <Text style={[styles.communityTabText, active && styles.communityTabTextActive]}>
                            {tab === "cooks" ? "Cooked photos" : "Reviews"}
                          </Text>
                          {count > 0 ? (
                            <View style={[styles.countBubble, active && styles.countBubbleActive]}>
                              <Text style={[styles.countBubbleText, active && styles.countBubbleTextActive]}>{count}</Text>
                            </View>
                          ) : null}
                        </PressableScale>
                      );
                    })}
                  </View>

                  {actionError ? (
                    <Animated.View entering={FadeInDown.duration(200)} style={[styles.banner, styles.errorBanner]}>
                      <AppIcon name="close" size={12} color={colors.danger} weight="bold" />
                      <Text style={styles.actionError}>{actionError}</Text>
                    </Animated.View>
                  ) : null}
                  {actionMessage ? (
                    <Animated.View entering={FadeInDown.duration(200)} style={[styles.banner, styles.successBanner]}>
                      <AppIcon name="checkCircle" size={14} color={colors.sage} />
                      <Text style={styles.actionMessage}>{actionMessage}</Text>
                    </Animated.View>
                  ) : null}

                  {communityTab === "cooks" ? (
                    <Animated.View key="cooks" entering={FadeInDown.duration(220)}>
                      {currentUser ? (
                        <View style={styles.cookPanel}>
                          <View style={styles.cookPanelHeader}>
                            <AppIcon name="pan" size={16} color={colors.terracotta} />
                            <Text style={styles.cookPanelTitle}>Cook & share</Text>
                          </View>
                          <Text style={styles.cookPanelSub}>Add a photo of your version to the community.</Text>
                          {cookImageUri ? (
                            <Image source={{ uri: cookImageUri }} style={styles.cookPreview} resizeMode="cover" />
                          ) : null}
                          <View style={styles.cookActions}>
                            <Button title={cookImageUri ? "Choose another" : "Choose photo"} icon="addPhoto" variant="outline" size="sm" onPress={() => void chooseCookPhoto()} />
                            {cookImageUri ? (
                              <Button title="Share cook" icon="forward" size="sm" loading={cookSaving} onPress={() => void shareCook()} />
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      {engagementLoading ? <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} /> : cookedPhotos.length ? (
                        <View style={styles.photoGrid}>
                          {cookedPhotos.map((photo, index) => (
                            <Animated.View key={photo.id || `${photo.profile_id}-${photo.post_id}-${photo.created_at}-${index}`} entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(240)} style={styles.cookedPhotoItem}>
                              <Image source={{ uri: photo.image_url }} style={styles.cookedPhoto} resizeMode="cover" />
                              <Text numberOfLines={1} style={styles.photoAuthor}>{photo.author_username}</Text>
                            </Animated.View>
                          ))}
                        </View>
                      ) : (
                        <EmptyState icon="camera" title="No cook photos yet" message="Share your version of this recipe to start the gallery." />
                      )}
                    </Animated.View>
                  ) : (
                    <Animated.View key="reviews" entering={FadeInDown.duration(220)}>
                      {currentUser && hasCooked ? (
                        <View style={styles.reviewForm}>
                          <Text style={styles.reviewFormTitle}>Leave a review</Text>
                          <View style={styles.ratingRow}>
                            <StarRating value={reviewRating} onChange={setReviewRating} size={24} />
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
                          <Button title="Post review" icon="check" size="sm" loading={reviewSaving} disabled={!canSubmitReview} onPress={() => void submitReview()} style={{ alignSelf: "flex-start", marginTop: 10 }} />
                        </View>
                      ) : currentUser ? (
                        <View style={styles.reviewGate}>
                          <View style={styles.cookPanelHeader}>
                            <AppIcon name="lock" size={14} color={colors.sage} />
                            <Text style={styles.reviewGateTitle}>Cook this recipe to leave a review.</Text>
                          </View>
                          <Text style={styles.reviewGateSub}>Share a cook photo first, then tell the community how it went.</Text>
                          <Button title="Share a cook photo" icon="camera" variant="outline" size="sm" onPress={() => setCommunityTab("cooks")} style={{ alignSelf: "flex-start" }} />
                        </View>
                      ) : null}

                      {engagementLoading ? <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} /> : reviews.length ? (
                        <View style={styles.reviewList}>
                          {reviews.map((review, index) => (
                            <Animated.View key={review.id || `${review.profile_id}-${review.created_at}-${index}`} entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(240)} style={styles.reviewItem}>
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
                                  <StarRating value={review.rating} size={13} />
                                </View>
                                <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                              </View>
                              {review.description ? <Text style={styles.reviewDescription}>{review.description}</Text> : null}
                              {(() => {
                                const cookedPhoto = getReviewCookPhoto(review);
                                return cookedPhoto?.image_url ? (
                                  <View style={styles.reviewCook}>
                                    <Image source={{ uri: cookedPhoto.image_url }} style={styles.reviewCookImage} resizeMode="cover" />
                                    <View style={styles.reviewCookCaptionRow}>
                                      <AppIcon name="camera" size={10} color={colors.muted} />
                                      <Text style={styles.reviewCookCaption}>Cooked by {review.author_username}</Text>
                                    </View>
                                  </View>
                                ) : null;
                              })()}
                            </Animated.View>
                          ))}
                        </View>
                      ) : (
                        <EmptyState icon="star" title="No reviews yet" message="Cook this recipe and share what you think." />
                      )}
                    </Animated.View>
                  )}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)" },
  sheetFrame: { width: "100%", maxWidth: 430, maxHeight: "94%" },
  detailCard: { maxHeight: "100%", overflow: "hidden", borderRadius: radii.xl, backgroundColor: colors.bg },
  detailHero: { height: 240, backgroundColor: colors.sageLight, overflow: "hidden" },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.12)" },
  heroFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  heroFallbackText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  closeButton: { position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)" },
  closeButtonHover: { backgroundColor: "rgba(0,0,0,0.65)" },
  difficultyBadge: { position: "absolute", top: 12, left: 12, maxWidth: 220, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.94)" },
  difficultyBadgeText: { flexShrink: 1, color: colors.sage, fontSize: 10, fontWeight: "800" },
  likeButton: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: "rgba(0,0,0,0.5)" },
  likeButtonHover: { backgroundColor: "rgba(0,0,0,0.68)" },
  likeButtonActive: { backgroundColor: colors.terracotta },
  likeButtonActiveHover: { backgroundColor: "#B5734E" },
  likeCount: { color: "#fff", fontSize: 12, fontWeight: "800" },
  detailContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
  detailTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: colors.ink },
  deleteButton: { alignSelf: "flex-start", marginTop: 10 },
  authorRow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, marginLeft: -6, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radii.pill },
  authorRowHover: { backgroundColor: colors.sageLight },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.sageLight },
  authorInitials: { alignItems: "center", justifyContent: "center", backgroundColor: colors.sage },
  authorInitialsText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  authorName: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  authorNameStrong: { color: colors.ink, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.sageLight },
  ratingPill: { backgroundColor: "#F8EED6" },
  metaText: { color: colors.sage, fontSize: 11, fontWeight: "700" },
  description: { marginTop: 16, color: colors.ink, fontSize: 13, lineHeight: 20 },
  tagRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  detailSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  detailSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  detailSectionTitle: { color: colors.sage, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 9 },
  listBullet: { width: 6, height: 6, marginTop: 6, borderRadius: 3, backgroundColor: colors.clay },
  listText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.sage },
  stepNumberText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  communitySection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  communityTabs: { flexDirection: "row", gap: 6, padding: 4, marginBottom: 14, borderRadius: radii.md, backgroundColor: colors.divider },
  communityTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: radii.sm },
  communityTabHover: { backgroundColor: "rgba(255,255,255,0.5)" },
  communityTabActive: { backgroundColor: colors.card, shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  communityTabText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  communityTabTextActive: { color: colors.ink },
  countBubble: { minWidth: 18, alignItems: "center", paddingHorizontal: 5, paddingVertical: 1, borderRadius: radii.pill, backgroundColor: colors.card },
  countBubbleActive: { backgroundColor: colors.sageLight },
  countBubbleText: { fontSize: 9, fontWeight: "800", color: colors.faint },
  countBubbleTextActive: { color: colors.sage },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.sm },
  errorBanner: { backgroundColor: colors.dangerBg },
  successBanner: { backgroundColor: colors.sageLight },
  cookPanel: { padding: 14, borderWidth: 1, borderColor: "#EDD5C4", borderRadius: radii.lg, backgroundColor: colors.terraBg },
  cookPanelHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  cookPanelTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  cookPanelSub: { marginTop: 3, marginBottom: 12, color: colors.muted, fontSize: 11, lineHeight: 16 },
  cookPreview: { width: "100%", height: 140, marginBottom: 10, borderRadius: radii.md, backgroundColor: colors.cream },
  cookActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  cookedPhotoItem: { width: "31%", minWidth: 88 },
  cookedPhoto: { width: "100%", aspectRatio: 1, borderRadius: radii.sm, backgroundColor: colors.sageLight },
  photoAuthor: { marginTop: 4, color: colors.muted, fontSize: 10, fontWeight: "600" },
  reviewForm: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.card },
  reviewFormTitle: { marginBottom: 10, color: colors.ink, fontSize: 13, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  reviewInput: { minHeight: 88, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.bg, color: colors.ink, fontSize: 13, lineHeight: 19 },
  reviewGate: { gap: 8, padding: 14, borderRadius: radii.lg, backgroundColor: colors.sageLight },
  reviewGateTitle: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: "800" },
  reviewGateSub: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  reviewList: { gap: 10, marginTop: 14 },
  reviewItem: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.card },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sageLight },
  reviewAuthor: { marginBottom: 2, color: colors.ink, fontSize: 12, fontWeight: "700" },
  reviewDate: { color: colors.faint, fontSize: 10 },
  reviewDescription: { marginTop: 8, color: colors.ink, fontSize: 12, lineHeight: 18 },
  reviewCook: { marginTop: 10, overflow: "hidden", borderRadius: radii.sm, backgroundColor: colors.sageLight },
  reviewCookImage: { width: "100%", height: 120, backgroundColor: colors.sageLight },
  reviewCookCaptionRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  reviewCookCaption: { color: colors.muted, fontSize: 10, fontWeight: "600" },
  actionError: { flex: 1, color: colors.danger, fontSize: 11, lineHeight: 16 },
  actionMessage: { flex: 1, color: colors.sage, fontSize: 11, fontWeight: "700" },
});
