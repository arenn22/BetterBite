import { useEffect, useState } from "react";

import { toRecipeCardData, type RecipeCardData } from "@/lib/recipes";
import { fetchHomePostSections, getLikedPostsByUser } from "@/services/api/posts";

type HomeFeeds = {
  recommended: RecipeCardData[];
  easyWins: RecipeCardData[];
  challenge: RecipeCardData[];
  friends: RecipeCardData[];
};

const EMPTY_HOME_FEEDS: HomeFeeds = { recommended: [], easyWins: [], challenge: [], friends: [] };

export function useHomeFeeds() {
  const [homeFeeds, setHomeFeeds] = useState<HomeFeeds>(EMPTY_HOME_FEEDS);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function loadHomeFeeds() {
      setFeedsLoading(true);
      try {
        const [feeds, likedPosts] = await Promise.all([fetchHomePostSections(), getLikedPostsByUser()]);
        if (!active) return;
        setHomeFeeds({
          recommended: feeds.recommended.map((post) => toRecipeCardData(post)),
          easyWins: feeds.easyWins.map((post) => toRecipeCardData(post)),
          challenge: feeds.challenge.map((post) => toRecipeCardData(post)),
          friends: feeds.friends.map((post) => toRecipeCardData(post, true)),
        });
        setLikedPostIds(new Set(likedPosts.map((post) => post.id)));
      } catch (error) {
        console.error("Error loading home feeds:", error);
        if (active) setHomeFeeds(EMPTY_HOME_FEEDS);
      } finally {
        if (active) setFeedsLoading(false);
      }
    }

    void loadHomeFeeds();
    return () => { active = false; };
  }, []);

  return { homeFeeds, setHomeFeeds, feedsLoading, likedPostIds, setLikedPostIds };
}
