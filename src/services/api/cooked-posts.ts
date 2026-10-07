import { supabase } from "../../lib/supabase";
import * as Crypto from "expo-crypto";
import type { Profile } from "../../types/auth";
import type { CookedPost, Post, PostReview } from "../../types/models";
import { getImageContentType, getImageFileExtension } from "./image-mime";
import { resolvePostImageUrl } from "./posts";
import { fetchUserProfile } from "./profiles";

export type CreateCookedPostParams = {
  profile_id: string;
  post_id: string;
  cooked_image_path?: string | null;
};

export type CreatePostReviewParams = {
  post_id: string;
  rating: number;
  description?: string | null;
};

function parseCookedPostId(value: unknown): number | null {
  const result = Array.isArray(value) ? value[0] : value;
  if (result === null || result === undefined) return null;

  if (typeof result === "object") {
    const row = result as Record<string, unknown>;
    const nestedResult = row.create_cooked_post;
    const candidate = row.id ?? row.cooked_id ?? row.cooked_post_id ?? nestedResult;
    return candidate === undefined ? null : parseCookedPostId(candidate);
  }

  if (typeof result !== "number" && typeof result !== "string") return null;

  const id = Number(result);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function findCookedPostId(
  profileId: string,
  postId: string,
  imagePath: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_cooked_posts");
  if (error) {
    console.error("Error resolving newly-created cooked post:", error.message);
    throw new Error(error.message);
  }

  const match = ((data || []) as CookedPost[])
    .map(normalizeCookedPost)
    .find((post) =>
      post.profile_id === profileId
      && post.post_id === postId
      && post.image_url === imagePath,
    );
  const cookedPostId = match ? parseCookedPostId(match.id) : null;

  if (cookedPostId === null) {
    throw new Error("Cooked post was created, but its row ID could not be resolved.");
  }

  return cookedPostId;
}

export async function createCookedPost(params: CreateCookedPostParams): Promise<number> {
  const { data: cookedPost, error: cookedPostError } =
    await supabase.rpc('create_cooked_post', {
      source_post_id: params.post_id,
      cooked_image_path: params.cooked_image_path ?? null,
    });



  if (cookedPostError) {
    throw new Error(`Failed to create cooked post: ${cookedPostError.message}`);
  }

  const returnedId = parseCookedPostId(cookedPost);
  if (returnedId !== null) return returnedId;
  if (!params.cooked_image_path) {
    throw new Error("Cooked post was created, but the RPC did not return its row ID.");
  }

  return findCookedPostId(params.profile_id, params.post_id, params.cooked_image_path);
}

export async function getCookedPostXp(cookedPostId: number): Promise<number | null> {
  if (!Number.isSafeInteger(cookedPostId) || cookedPostId <= 0) {
    throw new Error("A valid cooked post ID is required to fetch its XP award.");
  }

  const { data, error } = await supabase.rpc("get_cooked_post_xp", {
    p_cooked_post_id: cookedPostId,
  });

  if (error) {
    console.error("Error fetching cooked post XP:", error.message);
    throw new Error(error.message);
  }

  if (data === null) return null;

  const xp = Number(data);
  if (!Number.isSafeInteger(xp)) {
    throw new Error("The cooked post XP RPC returned an invalid XP award.");
  }

  return xp;
}

export async function createPostReview(params: CreatePostReviewParams) {
  const { data: review, error: reviewError } = await supabase.rpc(
    'create_post_review',
    {
      p_post_id: params.post_id,
      p_rating: params.rating,
      p_description: params.description ?? null,
    }
  );

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  return review;
}

export async function createCookedPostAndReview(params: CreateCookedPostParams & CreatePostReviewParams) {
  const cookedPost = await createCookedPost(params);
  let review;
  try {
    review = await createPostReview(params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown review error";
    throw new Error(`Cooked post was created, but the review failed: ${message}`);
  }

  return {
    cookedPost,
    review,
  };
}

export async function get_cooked_posts() {
  const {data: posts, error} = await supabase.rpc('get_cooked_posts');
  if(error) {
    console.error("Error fetching cooked posts:", error.message);
    return [];
  }
  else {
    return ((posts || []) as CookedPost[]).map(normalizeCookedPost);
  }
}

export async function get_post_reviews(post_id: string) {
  const {data: reviews, error} = await supabase.rpc('get_post_reviews', {target_post_id: post_id, limit_count: 20, offset_count: 0});
  if(error) {
    console.error("Error fetching post reviews:", error.message);
    return [];
  }
  else {
    return (reviews || []) as PostReview[];
  }
}

export type PostReviewWithAuthor = PostReview & {
  author_username: string;
  author_pfp_url: string | null;
};

export type CookedPhotoWithAuthor = CookedPost & {
  author_username: string;
  author_pfp_url: string | null;
};

function normalizeCookedPost(value: CookedPost): CookedPost {
  const row = value as CookedPost & {
    cooked_id?: string | null;
    cooked_at?: Date | string | null;
    cooked_image_url?: string | null;
    cooked_post_id?: string | null;
    source_post_id?: string | null;
    user_id?: string | null;
    image_path?: string | null;
    cooked_image_path?: string | null;
    cooked_post_image_path?: string | null;
    cooked_photo_path?: string | null;
    cooked_photo_url?: string | null;
    photo_path?: string | null;
    photo_url?: string | null;
    storage_path?: string | null;
    object_path?: string | null;
  };
  const imageValue = [
    row.cooked_image_path,
    row.cooked_post_image_path,
    row.cooked_photo_path,
    row.cooked_photo_url,
    row.cooked_image_url,
    row.image_path,
    row.photo_path,
    row.photo_url,
    row.storage_path,
    row.object_path,
    row.image_url,
  ].find((candidate) => typeof candidate === "string" && candidate.trim().length > 0);

  return {
    ...row,
    id: row.id || row.cooked_id || row.cooked_post_id || "",
    created_at: row.created_at || row.cooked_at || "",
    post_id: row.post_id || row.source_post_id || "",
    profile_id: row.profile_id || row.user_id || "",
    image_url: typeof imageValue === "string" ? imageValue : "",
  };
}

export async function fetchPostEngagement(postId: string): Promise<{
  reviews: PostReviewWithAuthor[];
  cookedPhotos: CookedPhotoWithAuthor[];
}> {
  const [reviews, allCookedPosts] = await Promise.all([
    get_post_reviews(postId),
    get_cooked_posts(),
  ]);
  const cookedPosts = allCookedPosts.filter((post) => post.post_id === postId);
  const profileIds = new Set([
    ...reviews.map((review) => review.profile_id),
    ...cookedPosts.map((post) => post.profile_id),
  ].filter(Boolean));
  const profiles = new Map<string, Profile>();

  await Promise.all([...profileIds].map(async (profileId) => {
    const profile = await fetchUserProfile(profileId);
    if (profile) profiles.set(profileId, profile);
  }));

  return {
    reviews: reviews.map((review) => {
      const profile = profiles.get(review.profile_id);
      return {
        ...review,
        author_username: profile?.username || "BetterBite member",
        author_pfp_url: profile?.pfp_url || null,
      };
    }),
    cookedPhotos: await Promise.all(cookedPosts.map(async (post) => {
      const profile = profiles.get(post.profile_id);
      return {
        ...post,
        image_url: await resolvePostImageUrl(post.image_url, "cooked_posts-images"),
        author_username: profile?.username || "BetterBite member",
        author_pfp_url: profile?.pfp_url || null,
      };
    })),
  };
}

export async function uploadCookedPostImage(
  imageUri: string,
  userId: string,
  postId: string,
): Promise<string> {
  const blob = await (await fetch(imageUri)).blob();
  const contentType = getImageContentType(blob.type, imageUri);
  const extension = getImageFileExtension(contentType);
  const path = `${userId}/${postId}/${Crypto.randomUUID()}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("cooked_posts-images")
    .upload(path, blob, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  return path;
}

export async function getCookedPostsByUser(userId: string): Promise<Post[]> {
  const cookedPosts = await get_cooked_posts();
  const userCookedPosts = cookedPosts.filter((post) => post.profile_id === userId);
  if (!userCookedPosts.length) return [];

  const postIds = [...new Set(userCookedPosts.map((post) => post.post_id))];
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("id", postIds);
  if (error) throw error;

  const postsById = new Map(((data || []) as Post[]).map((post) => [post.id, post]));
  return Promise.all(
    userCookedPosts.flatMap((cookedPost) => {
      const post = postsById.get(cookedPost.post_id);
      if (!post) return [];
      return [resolvePostImageUrl(cookedPost.image_url, "cooked_posts-images").then((imageUrl) => ({
        ...post,
        date_created: cookedPost.created_at,
        image_url: imageUrl || post.image_url,
      }))];
    }),
  );
}
