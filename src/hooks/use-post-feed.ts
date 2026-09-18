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
			if (!result.error) {
				const postRows = (result.data || []) as Post[];
				const profileIds = [
					...new Set(postRows.map((post) => post.profile_id)),
				];
				const profilesResult = profileIds.length
					? await supabase
							.from("profiles")
							.select("id, username, pfp_url")
							.in("id", profileIds)
					: { data: [], error: null };
				if (!active) return;
				const profiles = new Map(
					(profilesResult.data || []).map((profile) => [profile.id, profile]),
				);
				const postsWithImages = await Promise.all(
					postRows.map(async (post) => ({
						...post,
						image_url: await resolvePostImageUrl(post.image_url),
					})),
				);
				if (!active) return;
				setPosts(
					postsWithImages.map((post) => {
						const profile = profiles.get(post.profile_id);
						return {
							...post,
							author_username:
								profile?.username || post.author_username,
							author_pfp_url: profile?.pfp_url || null,
						};
					}),
				);
			}
			setLoading(false);
		}
		void loadPosts();
		return () => {
			active = false;
		};
	}, [authorId, enabled, limit]);

	return { posts, loading };
}

async function resolvePostImageUrl(imageValue: string | undefined) {
	if (!imageValue?.trim()) return "";

	const storagePath = getPostImagePath(imageValue);
	if (!storagePath) return imageValue;

	const { data } = await supabase.storage
		.from("post-images")
		.createSignedUrl(storagePath, 60 * 60);
	const publicUrl = supabase.storage
		.from("post-images")
		.getPublicUrl(storagePath).data.publicUrl;

	return data?.signedUrl || publicUrl || imageValue;
}

function getPostImagePath(imageValue: string) {
	if (!/^https?:\/\//i.test(imageValue)) return imageValue;

	try {
		const pathname = decodeURIComponent(new URL(imageValue).pathname);
		const marker = "/storage/v1/object/";
		const markerIndex = pathname.indexOf(marker);
		if (markerIndex === -1) return null;

		const bucketAndPath = pathname.slice(markerIndex + marker.length);
		const publicPrefix = "public/post-images/";
		const signedPrefix = "sign/post-images/";
		if (bucketAndPath.startsWith(publicPrefix)) {
			return bucketAndPath.slice(publicPrefix.length);
		}
		if (bucketAndPath.startsWith(signedPrefix)) {
			return bucketAndPath.slice(signedPrefix.length);
		}
	} catch {
		return null;
	}

	return null;
}
