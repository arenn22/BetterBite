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
  const { data: newPostId, error } = await supabase.rpc('create_recipe_post', {
    p_title: payload.title,
    p_description: payload.description,
    p_difficulty: payload.difficulty,
    p_image_url: payload.imageUrl,
    p_author_username: payload.authorUsername,
    p_recipe: payload.recipeJson,
    p_restriction_ids: payload.restrictionIds,
    p_cuisine_ids: payload.cuisineIds,
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

export async function likePost(postId: string, _userId: string) {
  const {error} = await supabase.rpc('like_post', {
    p_post_id: postId,
  });
  if(error) {
    console.error("Error liking post:", error.message);
  }
}

export async function getLikedPostsByUser(_userId: string): Promise<Post[]> {
  const { data, error } = await supabase.rpc('get_liked_posts_by_user', {

  });
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
  const {data: posts, error} = await supabase.rpc('get_recommended_posts', {limit_count: posts_per_section, offset_count: offset});
  if(error) {
    console.error("Error fetching recommended posts:", error.message);
    return [];
  }
  else {
    
    return (posts || []) as Post[];
  }
}

export async function get_easy_posts() {
  const {data: posts, error} = await supabase.rpc('get_easy_posts', {limit_count: posts_per_section, offset_count: offset});
  if(error) {
    console.error("Error fetching easy posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function get_challenge_posts() {
  const {data: posts, error} = await supabase.rpc('get_challenge_posts', {limit_count: posts_per_section, offset_count: offset});
  if(error) {
    console.error("Error fetching challenge posts:", error.message);
    return [];
  }
  else {
    return (posts || []) as Post[];
  }
}

export async function get_friend_posts() {
  const {data: posts, error} = await supabase.rpc('get_friend_posts', {limit_count: posts_per_section, offset_count: offset});
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

export async function create_cooked_post(
  source_post_id: string,
  cooked_image_path: string,
) {
  const safePath = cooked_image_path.replace(/^\/+/, "");

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUserData.user?.id) {
    throw new Error("You must be signed in to save a cooked recipe.");
  }

  const userFolder = `${authUserData.user.id}/`;
  if (!safePath.startsWith(userFolder) && !safePath.includes(`/${authUserData.user.id}/`)) {
    throw new Error("cooked_image_path must be inside the authenticated user folder");
  }

  const insertPayload = {
    source_post_id,
    profile_id: authUserData.user.id,
    cooked_image_path: safePath,
  };

  const directTableAttempts = ["cooked_posts", "cooked_post"];
  let lastInsertError: Error | null = null;

  for (const tableName of directTableAttempts) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select()
        .maybeSingle();

      if (!error && data) {
        console.log("Cooked post inserted directly:", data);
        return data;
      }

      const message = error?.message || "Direct insert failed";
      if (!/does not exist|relation .* does not exist|not found/i.test(message)) {
        lastInsertError = new Error(message);
      }
      console.warn(`Direct insert failed for ${tableName}:`, message);
    } catch (error) {
      lastInsertError = error instanceof Error ? error : new Error("Unknown direct insert error");
      console.warn(`Direct insert threw for ${tableName}:`, lastInsertError.message);
    }
  }

  const rpcAttempts = [
    { source_post_id, cooked_image_path: safePath },
    { p_source_post_id: source_post_id, p_cooked_image_path: safePath },
    { post_id: source_post_id, image_path: safePath },
  ];

  let lastError: Error | null = lastInsertError;
  for (const payload of rpcAttempts) {
    try {
      const { data, error } = await supabase.rpc('create_cooked_post', payload);
      if (!error) {
        console.log("Cooked post created successfully via RPC:", data);
        return data;
      }
      lastError = new Error(error.message);
      console.warn("create_cooked_post RPC attempt failed:", payload, error.message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown create_cooked_post error");
      console.warn("create_cooked_post RPC threw:", payload, lastError.message);
    }
  }

  throw new Error(lastError?.message || "Failed to create cooked post.");
}

export async function create_post_review(
  post_id: string,
  description: string,
  rating: number,
) {
  const normalizedDescription = typeof description === "string" ? description.trim() : "";
  const normalizedRating = Math.min(5, Math.max(0, Number(rating) || 0));

  if (!normalizedDescription.length) {
    return null;
  }

  const rpcAttempts = [
    { p_post_id: post_id, p_rating: normalizedRating, p_description: normalizedDescription },
    { post_id, rating: normalizedRating, description: normalizedDescription },
  ];

  let lastError: Error | null = null;
  for (const payload of rpcAttempts) {
    try {
      const { data, error } = await supabase.rpc("create_post_review", payload);
      if (!error) {
        return data;
      }
      lastError = new Error(error.message);
      console.warn("create_post_review RPC attempt failed:", payload, error.message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown create_post_review error");
      console.warn("create_post_review RPC threw:", payload, lastError.message);
    }
  }

  throw new Error(lastError?.message || "Failed to save review.");
}

export async function get_cooked_posts() {
  const {data: posts, error} = await supabase.rpc('get_cooked_posts', {limit_count: posts_per_section, offset_count: offset});
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