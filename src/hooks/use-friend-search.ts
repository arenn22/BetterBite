import { useMemo } from "react";

type SearchableFriend = { name: string };

export function useFriendSearch<T extends SearchableFriend>(friends: T[], query: string) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery ? friends.filter((friend) => friend.name.toLowerCase().includes(normalizedQuery)) : null;
  }, [friends, query]);
}
