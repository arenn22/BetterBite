import { supabase } from "../../lib/supabase";
import type { SearchUserResult } from "../../types/auth";
import type { LeaderboardEntry, PendingFriendRequest } from "../../types/models";

export async function searchUsers(searchQuery: string): Promise<SearchUserResult[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, pfp_url')
    .ilike('username', `%${searchQuery}%`);

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

type LeaderboardRpcName =
  | "get_streak_leaderboard_from_everyone"
  | "get_streak_leaderboard_from_friends"
  | "get_lifetime_xp_leaderboard_from_everyone"
  | "get_lifetime_xp_leaderboard_from_friends"
  | "get_lifetime_cooked_posts_leaderboard_from_everyone"
  | "get_lifetime_cooked_posts_leaderboard_from_friends"
  | "get_lifetime_created_posts_leaderboard_from_everyone"
  | "get_lifetime_created_posts_leaderboard_from_friends";

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.rank === "number" &&
    typeof entry.profile_id === "string" &&
    typeof entry.username === "string" &&
    (typeof entry.pfp_url === "string" || entry.pfp_url === null) &&
    typeof entry.score === "number"
  );
}

async function fetchLeaderboard(
  rpcName: LeaderboardRpcName,
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc(rpcName, { p_limit, p_offset });

  if (error) {
    console.error(`Error fetching ${rpcName}:`, error.message);
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) {
    throw new Error(`${rpcName} returned an invalid leaderboard response.`);
  }

  return data.map((entry: unknown, index) => {
    if (!isLeaderboardEntry(entry)) {
      throw new Error(`${rpcName} returned an invalid leaderboard row at index ${index}.`);
    }
    return entry;
  });
}

export async function getStreakLeaderboardFromEveryone(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_streak_leaderboard_from_everyone", p_limit, p_offset);
}

export async function getStreakLeaderboardFromFriends(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_streak_leaderboard_from_friends", p_limit, p_offset);
}

export async function getLifetimeXPLeaderboardFromEveryone(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_xp_leaderboard_from_everyone", p_limit, p_offset);
}

export async function getLifetimeXPLeaderboardFromFriends(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_xp_leaderboard_from_friends", p_limit, p_offset);
}

export async function getLifetimeCookedPostsLeaderboardFromEveryone(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_cooked_posts_leaderboard_from_everyone", p_limit, p_offset);
}

export async function getLifetimeCookedPostsLeaderboardFromFriends(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_cooked_posts_leaderboard_from_friends", p_limit, p_offset);
}

export async function getLifetimeCreatedPostsLeaderboardFromEveryone(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_created_posts_leaderboard_from_everyone", p_limit, p_offset);
}

export async function getLifetimeCreatedPostsLeaderboardFromFriends(
  p_limit = 50,
  p_offset = 0,
): Promise<LeaderboardEntry[]> {
  return fetchLeaderboard("get_lifetime_created_posts_leaderboard_from_friends", p_limit, p_offset);
}