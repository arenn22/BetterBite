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

export async function resolvePostImageUrl(
	imageValue: string | undefined,
	bucketName: string = "post-images",
) {
	const trimmed = imageValue?.trim();
	if (!trimmed) return "";
	if (/^data:/i.test(trimmed)) return trimmed;

	const storagePath = getPostImagePath(trimmed, bucketName) ?? trimmed.replace(/^\/+/, "");
	if (!storagePath) return trimmed;

	try {
		const { data, error } = await supabase.storage
			.from(bucketName)
			.createSignedUrl(storagePath, 60 * 60);

		if (!error && data?.signedUrl) return data.signedUrl;
	} catch {
		// fall through to public URL fallback below
	}

	try {
		const publicUrl = supabase.storage
			.from(bucketName)
			.getPublicUrl(storagePath).data.publicUrl;
		if (publicUrl) return publicUrl;
	} catch {
		// if the bucket lookup fails, keep the original image URL
	}

	return trimmed;
}

export function getPostImagePath(imageValue: string, bucketName: string = "post-images") {
	const normalized = imageValue.trim();
	if (!normalized) return "";

	if (!/^https?:\/\//i.test(normalized)) {
		const cleaned = normalized.replace(/^\/+/, "");
		const publicPrefix = `public/${bucketName}/`;
		const signedPrefix = `sign/${bucketName}/`;
		if (cleaned.startsWith(publicPrefix)) return cleaned.slice(publicPrefix.length);
		if (cleaned.startsWith(signedPrefix)) return cleaned.slice(signedPrefix.length);
		if (cleaned.startsWith(`${bucketName}/`)) return cleaned.slice(`${bucketName}/`.length);
		return cleaned;
	}

	try {
		const pathname = decodeURIComponent(new URL(normalized).pathname);
		const marker = "/storage/v1/object/";
		const markerIndex = pathname.indexOf(marker);
		if (markerIndex === -1) return null;

		const bucketAndPath = pathname.slice(markerIndex + marker.length);
		const publicPrefix = `public/${bucketName}/`;
		const signedPrefix = `sign/${bucketName}/`;
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
