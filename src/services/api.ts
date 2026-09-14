import { supabase } from "../lib/supabase";
import type { AuthResult, Profile } from "../types/auth";

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
    .select("username, date_joined")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError.message);
  }

  const date = profileData?.date_joined ? new Date(profileData.date_joined) : null;
  const authProfile: AuthResult = {
    profile: {
      id: data.user.id,
      username: profileData?.username || data.user.user_metadata?.username || "",
      email: data.user.email || email,
      date_joined: date,
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




// Type definitions matching your Postgres schema fields
export interface CreatePostPayload {
  title: string;
  description: string;
  difficulty: number;
  imageUrl: string;
  authorUsername: string;
  recipeJson: Record<string, any>; // For your jsonb recipe data structure
  restrictionIds: number[];       // Array of IDs for post_restrictions
  cuisineIds: number[];           // Array of IDs for post_cuisines
}

/**
 * Creates a recipe post along with its junction table attachments (cuisines & dietary restrictions)
 * in a single atomic database operation.
 * 
 * @param payload The clean post data from your application state
 * @returns The newly created post UUID string
 */
export async function createRecipePost(payload: CreatePostPayload): Promise<string> {
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


