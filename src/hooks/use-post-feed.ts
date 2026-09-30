import { useEffect, useState } from "react";

import { fetchPosts } from "@/services/api";
import type { Post } from "@/types/models";

export function usePostFeed(
	options: { authorId?: string; limit?: number; enabled?: boolean } = {},
) {
	const { authorId, limit = 30, enabled = true } = options;
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!enabled) {
			setPosts([]);
			setLoading(false);
			return;
		}
		let active = true;
		async function loadPosts() {
			setLoading(true);
			try {
				const result = await fetchPosts({ authorId, limit });
				if (active) setPosts(result);
			} catch (error) {
				console.error("Error fetching posts:", error);
				if (active) setPosts([]);
			} finally {
				if (active) setLoading(false);
			}
		}
		void loadPosts();
		return () => {
			active = false;
		};
	}, [authorId, enabled, limit]);

	return { posts, loading };
}
