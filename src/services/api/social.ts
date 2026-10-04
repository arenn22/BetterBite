import { supabase } from "../../lib/supabase";
import type { PendingFriendRequest } from "../../types/models";
import type { SearchUserResult } from "../../types/auth";

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