import { StyleSheet, View } from "react-native";

import { toPostCardProps } from "@/lib/post-card-data";
import type { Post } from "@/types/models";

import { PostCard } from "./post-card";

export function PostGrid({ posts }: { posts: Post[] }) {
	return (
		<View style={styles.grid}>
			{posts.map((post, index) => (
				<View style={styles.item} key={`${post.id ?? "post"}-${index}`}>
					<PostCard {...toPostCardProps(post)} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { gap: 22, alignItems: "center" },
	item: { width: "100%" },
});
