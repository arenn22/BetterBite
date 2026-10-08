import { supabase } from "../../lib/supabase";
import { getImageContentType } from "./image-mime";
import type { Profile } from "../../types/auth";

export const DEFAULT_PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80";

export async function getXpPercentageLeftToNextLevel(): Promise<number | null> {
  const { data, error } = await supabase.rpc(
    "get_xp_percentage_left_to_next_level",
    {},
  );

  if (error) {
    console.error("Error fetching XP progress:", error.message);
    throw new Error(error.message);
  }

  if (data === null) return null;

  const percentage = Number(data);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("The XP progress RPC returned an invalid percentage.");
  }

  return percentage;
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
  const contentType = getImageContentType(blob.type, imageUri);
  const imageBlob = blob.slice(0, blob.size, contentType);

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(path, imageBlob, {
      contentType,
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

export async function set_my_dietary_restrictions(restrictionIds: number[]) {
  const { error } = await supabase.rpc("set_my_dietary_restrictions", {
    p_restriction_ids: restrictionIds,
  });
  if (error) throw new Error(error.message);
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

export async function updateProfileUsername(username: string): Promise<void> {
  const normalizedUsername = username.trim();
  if (normalizedUsername.length < 4) {
    throw new Error("Username must be at least 4 characters long.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Sign in again to update your username.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ username: normalizedUsername })
    .eq("id", authData.user.id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Your username could not be updated. Check your connection and try again.");
  }
}

export async function updatePassword(password: string): Promise<void> {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Sign in again to update your password.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function updateNotificationPreferences(
  notifyStreaks: boolean,
  notifyFriendActivity: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_my_notification_preferences", {
    p_notify_streaks: notifyStreaks,
    p_notify_friend_activity: notifyFriendActivity,
  });
  if (error) throw new Error(error.message);
}

