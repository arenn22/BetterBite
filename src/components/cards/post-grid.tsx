import { StyleSheet, View } from "react-native";

import { toPostCardProps } from "@/lib/post-card-data";
import type { Post } from "@/types/models";

import { PostCard } from "./post-card";

export function PostGrid({ posts }: { posts: Post[] }) {
	return (
		<View style={styles.grid}>
			{posts.map((post) => (
				<View style={styles.item} key={post.id}>
					<PostCard {...toPostCardProps(post)} compact />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	item: { width: "48%" },
});
