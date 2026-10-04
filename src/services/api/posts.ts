import { supabase } from "../../lib/supabase";
import type { CreatePostPayload, Post } from "../../types/models";

export type HomePostSections = {
  recommended: Post[];
  easyWins: Post[];
  challenge: Post[];
  friends: Post[];
};

export async function createPost(payload: CreatePostPayload): Promise<string> {
  const { data: newPostId, error } = await supabase.rpc('create_post', {
    p_title: payload.title,
    p_description: payload.description,
    p_difficulty: payload.difficulty,
    p_image_url: payload.imageUrl,
    p_author_username: payload.authorUsername,
    p_recipe: payload.recipeJson,
    p_restriction_ids: payload.restrictionIds,
    p_cuisine_ids: payload.cuisineIds,
    p_time: payload.time,
  });

  if (error) {
    console.error('Database Error in createRecipePost:', error.message);
    throw new Error(error.message);
  }

  if (!newPostId) {
    throw new Error('Post creation completed but failed to return a valid UUID.');
  }

  return newPostId;
}

async function hydratePosts(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return [];
  const profileIds = [...new Set(posts.map((post) => post.profile_id))];
  const { data: profileRows, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, pfp_url")
        .in("id", profileIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const profiles = new Map(
    (profileRows || []).map((profile) => [profile.id, profile]),
  );
  return Promise.all(
    posts.map(async (post) => {
      const profile = profiles.get(post.profile_id);
      return {
        ...post,
        image_url: await resolvePostImageUrl(post.image_url),
        author_username: profile?.username || post.author_username,
        author_pfp_url: profile?.pfp_url || null,
      };
    }),
  );
}

export async function fetchPosts(options: { authorId?: string; limit?: number } = {}): Promise<Post[]> {
  const { authorId, limit = 30 } = options;
  let query = supabase
    .from("posts")
    .select("*")
    .order("date_created", { ascending: false })
    .limit(limit);
  if (authorId) query = query.eq("profile_id", authorId);

  const { data: postRows, error } = await query;
  if (error) throw error;

  return hydratePosts((postRows || []) as Post[]);
}

export async function resolvePostImageUrl(
  imageValue: string | undefined,
  bucketName = "post-images",
): Promise<string> {
  const trimmed = imageValue?.trim();
  if (!trimmed) return "";
  if (/^data:/i.test(trimmed)) return trimmed;

  const resolvedStoragePath = getPostImagePath(trimmed, bucketName);
  if (/^https?:\/\//i.test(trimmed) && resolvedStoragePath === null) return trimmed;

  const storagePath = resolvedStoragePath ?? trimmed.replace(/^\/+/, "");
  if (!storagePath) return trimmed;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 60 * 60);
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch {
    // Use the public URL fallback below.
  }

  try {
    const publicUrl = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath).data.publicUrl;
    if (publicUrl) return publicUrl;
  } catch {
    // Keep the original image URL if storage lookup fails.
  }

  return trimmed;
}

export function getPostImagePath(imageValue: string, bucketName = "post-images") {
  const normalized = imageValue.trim();
  if (!normalized) return "";

  if (!/^https?:\/\//i.test(normalized)) {
    const cleaned = normalized.replace(/^\/+/, "");
    const publicPrefix = `public/${bucketName}/`;
    const signedPrefix = `sign/${bucketName}/`;
    if (cleaned.startsWith(publicPrefix)) return cleaned.slice(publicPrefix.length);
    if (cleaned.startsWith(signedPrefix)) return cleaned.slice(signedPrefix.length);
    if (cleaned.startsWith(`${bucketName}/`)) return cleaned.slice(`${bucketName}/`.length);
    return cleaned;
  }

  try {
    const pathname = decodeURIComponent(new URL(normalized).pathname);
    const marker = "/storage/v1/object/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const bucketAndPath = pathname.slice(markerIndex + marker.length);
    const publicPrefix = `public/${bucketName}/`;
    const signedPrefix = `sign/${bucketName}/`;
    if (bucketAndPath.startsWith(publicPrefix)) return bucketAndPath.slice(publicPrefix.length);
    if (bucketAndPath.startsWith(signedPrefix)) return bucketAndPath.slice(signedPrefix.length);
  } catch {
    return null;
  }

  return null;
}

export async function uploadPostImage(imageUri: string, userId: string): Promise<string> {
  const filename = imageUri.split("/").pop() || `${Date.now()}.jpg`;
  const path = `${userId}/${Date.now()}-${filename}`;
  const blob = await (await fetch(imageUri)).blob();
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function fetchPostsByDietaryRestrictions(dietaryRestrictions: number[]): Promise<Post[]> {
  if (!dietaryRestrictions.length) {
    return [];
  }

  const tableCandidates = ["post_restrictions", "post_dietary_restrictions", "recipe_post_restrictions"];
  const columnCandidates = ["restriction_id", "dietary_restriction_id", "restriction", "id"];
  const lastErrors: string[] = [];

  for (const tableName of tableCandidates) {
    for (const columnName of columnCandidates) {
      const { data: restrictionRows, error: restrictionError } = await supabase
        .from(tableName)
        .select("post_id")
        .in(columnName, dietaryRestrictions);

      if (restrictionError) {
        const message = restrictionError.message || "unknown DB error";
        if (!/does not exist|column .* does not exist|not found/i.test(message)) {
          lastErrors.push(`${tableName}.${columnName}: ${message}`);
        }
        continue;
      }

      const postIds = [...new Set((restrictionRows || []).map((row) => row.post_id).filter(Boolean))];
      if (!postIds.length) return [];

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (error) {
        console.error("Error fetching posts by dietary restrictions:", error.message);
        return [];
      }

      return (posts || []) as Post[];
    }
  }

  if (lastErrors.length) {
    console.warn("No dietary restriction join table matched the schema. Last errors:", lastErrors);
  }

  return [];
}

export async function fetchPostByCuisines(cuisines: number[]): Promise<Post[]> {
  if (!cuisines.length) {
    return [];
  }

  const tableCandidates = ["post_cuisines", "post_cuisine", "recipe_post_cuisines"];
  const columnCandidates = ["cuisine_id", "cuisine", "id"];
  const lastErrors: string[] = [];

  for (const tableName of tableCandidates) {
    for (const columnName of columnCandidates) {
      const { data: cuisineRows, error: cuisineRowsError } = await supabase
        .from(tableName)
        .select("post_id")
        .in(columnName, cuisines);

      if (cuisineRowsError) {
        const message = cuisineRowsError.message || "unknown DB error";
        if (!/does not exist|column .* does not exist|not found/i.test(message)) {
          lastErrors.push(`${tableName}.${columnName}: ${message}`);
        }
        continue;
      }

      const postIds = [...new Set((cuisineRows || []).map((row) => row.post_id).filter(Boolean))];
      if (!postIds.length) return [];

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (error) {
        console.error("Error fetching posts by cuisines:", error.message);
        return [];
      }

      return (posts || []) as Post[];
    }
  }

  if (lastErrors.length) {
    console.warn("No cuisine join table matched the schema. Last errors:", lastErrors);
  }

  return [];
}

export async function fetchPostsByDifficulty(difficulty: number): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("difficulty", difficulty);
  if(error) {
    console.error("Error fetching posts by difficulty:", error.message);
    return [];
  }
  return (data || []) as Post[];
}

export async function likePost(postId: string): Promise<void> {
  const {error} = await supabase.rpc('like_post', {
    p_post_id: postId,
  });
  if(error) {
    console.error("Error liking post:", error.message);
    throw new Error(error.message);
  }
}

export async function getLikedPostsByUser(): Promise<Post[]> {
  const { data, error } = await supabase.rpc('get_liked_posts');
  if(error) {
    console.error("Error fetching liked posts:", error.message);
    return [];
  }
  else {
    return (data || []) as Post[];
  }
}

export async function get_post_by_profile_restrictions() {
  const {data: restrictions, error} = await supabase.rpc('get_my_dietary_restrictions');
  if(error) {
    console.error("Error fetching profile restrictions:", error.message);
    return [];
  }
  else {
    const {data: posts, error} = await supabase.rpc('get_posts_by_dietary_restrictions', { p_restriction_ids: restrictions });
    if(error) {
      console.error("Error fetching posts by dietary restrictions:", error.message);
      return [];
    }
    else {
      return (posts || []) as Post[];
    }
  }
}

export async function get_posts_by_profile_experience() {
  const {data: posts, error} = await supabase.rpc('get_posts_by_experience_level');
  if(error) {
    console.error("Error fetching posts by experience level:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

const posts_per_section = 5;
const offset = 0;

export async function get_recommended_posts() {
  const {data: posts, error} = await supabase.rpc('get_recommended_posts');
  if(error) {
    console.error("Error fetching recommended posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function get_easy_posts() {
  const {data: posts, error} = await supabase.rpc('get_easy_posts');
  if(error) {
    console.error("Error fetching easy posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function get_challenge_posts() {
  const {data: posts, error} = await supabase.rpc('get_challenge_posts');
  if(error) {
    console.error("Error fetching challenge posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function get_friend_posts() {
  const {data: posts, error} = await supabase.rpc('get_friend_posts');
  if(error) {
    console.error("Error fetching friend posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function fetchHomePostSections(): Promise<HomePostSections> {
  const [recommended, easyWins, challenge, friends] = await Promise.all([
    get_recommended_posts(),
    get_easy_posts(),
    get_challenge_posts(),
    get_friend_posts(),
  ]);
  const sourceSections = { recommended, easyWins, challenge, friends };
  const uniquePosts = [...new Map(
    Object.values(sourceSections).flat().map((post) => [post.id, post]),
  ).values()];
  if (!uniquePosts.length) return sourceSections;

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("*")
    .in("id", uniquePosts.map((post) => post.id));
  if (error) throw error;

  const canonicalPosts = new Map(((postRows || []) as Post[]).map((post) => [post.id, post]));
  const mergedPosts = uniquePosts.map((post) => {
    const canonical = canonicalPosts.get(post.id);
    if (!canonical) return post;

    return {
      ...canonical,
      ...post,
      title: canonical.title || post.title,
      image_url: canonical.image_url || post.image_url,
      date_created: canonical.date_created || post.date_created,
      likes: canonical.likes ?? post.likes,
      views: canonical.views ?? post.views,
      time: canonical.time ?? post.time,
    };
  });
  const hydratedPosts = await hydratePosts(mergedPosts);
  const hydratedById = new Map(hydratedPosts.map((post) => [post.id, post]));
  const hydrateSection = (posts: Post[]) => posts.flatMap((post) => {
    const hydratedPost = hydratedById.get(post.id);
    return hydratedPost ? [hydratedPost] : [];
  });

  return {
    recommended: hydrateSection(recommended),
    easyWins: hydrateSection(easyWins),
    challenge: hydrateSection(challenge),
    friends: hydrateSection(friends),
  };
}

export async function get_liked_posts() {
  const {data: posts, error} = await supabase.rpc('get_liked_posts', {limit_count: posts_per_section, offset_count: offset});
  if(error) {
    console.error("Error fetching liked posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}