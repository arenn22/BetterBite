import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { AuthResult, Profile } from "../../types/auth";
import { DEFAULT_PROFILE_IMAGE } from "./profiles";

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
    .select("*")
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