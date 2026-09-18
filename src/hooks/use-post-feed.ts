import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
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
			let query = supabase
				.from("posts")
				.select("*")
				.order("date_created", { ascending: false })
				.limit(limit);
			if (authorId) query = query.eq("profile_id", authorId);
			const result = await query;
			if (!active) return;
			if (!result.error) setPosts((result.data || []) as Post[]);
			setLoading(false);
		}
		void loadPosts();
		return () => {
			active = false;
		};
	}, [authorId, enabled, limit]);

	return { posts, loading };
}
