import type { PostCardProps } from "@/components/cards/post-card";
import type { Post } from "@/types/models";

function formatPostTime(value: Date | string | undefined) {
	if (!value) return "Recently";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Recently";
	const minutes = Math.max(
		0,
		Math.round((Date.now() - date.getTime()) / 60000),
	);
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hr ago`;
	return `${Math.round(hours / 24)} days ago`;
}

export function toPostCardProps(post: Post): PostCardProps {
	const username = post.author_username || "BetterBite member";
	return {
		postId: post.id,
		likeCount: post.likes || 0,
		username,
		initials: username.slice(0, 2).toUpperCase(),
		profilePictureUrl: post.author_pfp_url,
		meal: post.title || "Untitled recipe",
		description:
			post.description ||
			"A recipe shared with the BetterBite community.",
		imageUrl: post.image_url,
		timeAgo: formatPostTime(post.date_created),
		tag: `Level ${post.difficulty || 1}`,
		difficulty: post.difficulty || 1,
		recipe: post.recipe,
	};
}
