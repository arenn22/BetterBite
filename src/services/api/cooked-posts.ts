import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/auth";
import type { CookedPost, Post, PostReview } from "../../types/models";
import { resolvePostImageUrl } from "./posts";
import { fetchUserProfile } from "./profiles";

type CreateCookedPostAndReviewParams = {
  profile_id: string;
  post_id: string;
  image_url?: string | null;
  rating: number;
  description?: string | null;
};

export async function createCookedPostAndReview(
  params: CreateCookedPostAndReviewParams
) {
  const {
    profile_id,
    post_id,
    image_url = null,
    rating,
    description = null,
  } = params;

  const { data: cookedPost, error: cookedPostError } =
    await supabase.rpc('create_cooked_post', {
      p_profile_id: profile_id,
      p_post_id: post_id,
      p_image_url: image_url,
    });

  if (cookedPostError) {
    throw new Error(
      `Failed to create cooked post: ${cookedPostError.message}`
    );
  }

  const { data: review, error: reviewError } = await supabase.rpc(
    'create_post_review',
    {
      p_profile_id: profile_id,
      p_post_id: post_id,
      p_rating: rating,
      p_description: description,
    }
  );

  if (reviewError) {
    throw new Error(
      `Cooked post was created, but the review failed: ${reviewError.message}`
    );
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
    return (posts || []) as CookedPost[];
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
  const path = `${userId}/${postId}/${crypto.randomUUID()}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("cooked_posts-images")
    .upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  return supabase.storage
    .from("cooked_posts-images")
    .getPublicUrl(path).data.publicUrl;
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