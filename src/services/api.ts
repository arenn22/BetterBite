import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AuthResult, Profile, SearchUserResult } from "../types/auth";
import type { CookedPost, CreatePostPayload, PendingFriendRequest, Post, PostReview } from "../types/models";
export const DEFAULT_PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80";

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function handleSignUp(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if(username.length < 4) {
    return {profile: null, error: "Username must be at least 4 characters long"};
  }
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(authError.message);
    return {profile: null, error: authError.message};
  }

  if (!authData.user) {
    return {profile: null, error: "Failed to create user"};
  }
  
  const dateJoined = new Date().toISOString().slice(0, 10);

  const profile: Profile = {
    id: authData.user.id,
    username,
    email,
    date_joined: new Date(dateJoined),
    pfp_url: DEFAULT_PROFILE_IMAGE,
  };

  const { error: profileError } = await supabase.from("profiles").insert({
    ...profile,
    date_joined: dateJoined,
  });

  if (profileError) {
    console.error("Profile error:", profileError.message);
    return {profile: null, error: profileError.message};
  }

  return {profile, error: null};
}

export async function handleSignInEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error || !data.user) {
    return { profile: null, error: error?.message ?? "Failed to sign in" };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, date_joined, pfp_url, streakCount, last_streak_post")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError.message);
  }

  const date = profileData?.date_joined ? new Date(profileData.date_joined) : null;
  const streakValue = Number((profileData as any)?.streakCount ?? (profileData as any)?.streakcount ?? 0);
  const lastStreakPost = (profileData as any)?.last_streak_post ?? (profileData as any)?.last_post_at ?? null;

  const authProfile: AuthResult = {
    profile: {
      id: data.user.id,
      username: profileData?.username || data.user.user_metadata?.username || "",
      email: data.user.email || email,
      date_joined: date,
      pfp_url: profileData?.pfp_url || DEFAULT_PROFILE_IMAGE,
      streakCount: streakValue,
      streakcount: streakValue,
      last_streak_post: lastStreakPost,
      last_post_at: lastStreakPost,
    },
    error: null,
  };
  console.log("Signed in user profile:", authProfile);
  return authProfile;
}

export async function handleSignInUsername(
  username: string,
  password: string
): Promise<AuthResult> {
    const email = await getEmailWithUsername(username);
    if (!email) {
        return { profile: null, error: "No account found for that username" };
    }

    return handleSignInEmail(email, password);
}

async function getEmailWithUsername(username: string) {
    const {data, error} = await supabase.rpc('get_email_with_username', {
        usernameval: username,
    })

    if(error) {
        console.error('Error fetching email:', error.message);
        return null;
    }

    if(data && data.length > 0) {
        console.log('Fetched email:', data[0].email);
        return data[0].email;
    }
    return null;
}





export async function createPost(payload: CreatePostPayload): Promise<string> {
  // Call the database function via Remote Procedure Call (RPC)
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

  // Handle RLS policy rejections or database errors
  if (error) {
    console.error('Database Error in createRecipePost:', error.message);
    throw new Error(error.message);
  }

  if (!newPostId) {
    throw new Error('Post creation completed but failed to return a valid UUID.');
  }

  return newPostId;
}

/**
 * Fetches all available dietary restrictions from the database.
 */
export async function fetchDietaryRestrictions() {
  const { data, error } = await supabase
    .from('dietary_restrictions')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetches all available cuisine options from the database.
 */
export async function fetchCuisines() {
  const { data, error } = await supabase
    .from('cuisines') // Verify if your table name is 'cuisines' or 'cuisine_options'
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateCuisinePreferences(
  userId: string,
  cuisineIds: number[],
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ cuisine_preferences: cuisineIds })
    .eq("id", userId);

  if (error) throw error;
}

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const streakValue = Number((data as any).streakCount ?? (data as any).streakcount ?? 0);
  const lastStreakPost = (data as any).last_streak_post ?? (data as any).last_post_at ?? null;

  return {
    ...data,
    streakCount: streakValue,
    streakcount: streakValue,
    last_streak_post: lastStreakPost,
    last_post_at: lastStreakPost,
  } as Profile;
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

  const posts = (postRows || []) as Post[];
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

export async function resolvePostImageUrl(
  imageValue: string | undefined,
  bucketName = "post-images",
): Promise<string> {
  const trimmed = imageValue?.trim();
  if (!trimmed) return "";
  if (/^data:/i.test(trimmed)) return trimmed;

  const storagePath = getPostImagePath(trimmed, bucketName) ?? trimmed.replace(/^\/+/, "");
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

export async function updateProfilePhoto(userId: string, imageUri: string): Promise<string> {
  const filename = imageUri.split("/").pop() || `${Date.now()}.jpg`;
  const path = `profile-photos/${userId}/${Date.now()}-${filename}`;
  const blob = await (await fetch(imageUri)).blob();

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const publicUrl = supabase.storage
    .from("post-images")
    .getPublicUrl(path).data.publicUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ pfp_url: publicUrl })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return publicUrl;
}

export async function searchUsers(searchQuery: string): Promise<SearchUserResult[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, pfp_url')
    .ilike('username', `%${searchQuery}%`); // Matches partial names (e.g., "joh" matches "john")

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return (data || []) as SearchUserResult[];
}


export async function sendFriendRequest(receiverId: string): Promise<void> {
  const {data, error} = await supabase.rpc('send_friend_request', {
    p_receiver_id: receiverId,
  });
  if(error) {
    console.error('Error sending friend request:', error.message);
    throw new Error('Failed to send friend request.');
  }
  else {
    console.log('Friend request sent successfully:', data);
    return data;
  }
}

export async function respondToFriendRequest(requestId: number, accept: boolean): Promise<void> {
  const {data, error} = await supabase.rpc('respond_to_friend_request', {
    p_request_id: requestId,
    p_accept: accept,
  });

  if(error) {
    console.error('Error responding to friend request:', error.message);
    throw new Error('Failed to respond to friend request.');
  }
  else {
    console.log('Friend request response processed successfully:', data);
    return data;
  }
}

export async function fetchFriends() {
  const { data, error } = await supabase.rpc("get_my_friends", {
  })

  if (error) {
    console.error("Error fetching friends:", error.message);
    return [];
  }
  else {
    return data || [];
  }
}



export async function fetchFriendRequests(): Promise<PendingFriendRequest[]> {
  const { data, error } = await supabase.rpc('get_pending_friend_requests')

  if (error) {
    console.error("Error fetching friend requests:", error.message);
    return [];
  }
  else {
    return (data || []).flatMap((request: Record<string, unknown>) => {
      const friendshipId = request.friendship_id ?? request.id ?? request.request_id;
      if (friendshipId === null || friendshipId === undefined) {
        console.error('Pending friend request did not include a friendship ID:', request);
        return [];
      }

      return [{
        ...request,
        id: Number(friendshipId),
      } as PendingFriendRequest];
    });
  }
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

      if (!postIds.length) {
        return [];
      }

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

      if (!postIds.length) {
        return [];
      }

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

export async function set_my_dietary_restrictions(restrictionIds: number[]) {
  const {error} = await supabase.rpc('set_my_dietary_restrictions', { p_restriction_ids: restrictionIds });
  if(error) {
    console.error("Error setting dietary restrictions:", error.message);
  }
}

export async function set_my_experience_level(difficulty: number) {
  const normalizedDifficulty = Math.min(10, Math.max(1, Math.round(Number(difficulty) || 1)));

  try {
    const { error } = await supabase.rpc('set_my_experience_level', {
      p_experience_level: normalizedDifficulty,
    });

    if (!error) return;

    const legacyErrorMessage = error.message?.toLowerCase() ?? "";
    const needsFallback =
      legacyErrorMessage.includes("could not find the function") ||
      legacyErrorMessage.includes("between 1 and 5") ||
      legacyErrorMessage.includes("must be between 1 and 5");

    if (!needsFallback) {
      throw error;
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user?.id) {
      throw authError ?? new Error("Unable to determine the current user.");
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ experience_level: normalizedDifficulty })
      .eq("id", authUser.user.id);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error setting experience level:", message);
    throw error;
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

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeToAuthStateChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function updateProfileUsername(userId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", userId);

  if (error) throw error;
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