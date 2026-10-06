import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, shadowSm } from "@/app/(tabs)/theme";
import { DIFFICULTY_COLORS, formatCount, type RecipeCardData } from "@/lib/recipes";

export function RecipeCard({
  recipe,
  onPress,
  onAuthorPress,
  width,
  compact = false,
}: {
  recipe: RecipeCardData;
  onPress: () => void;
  onAuthorPress?: () => void;
  width?: number;
  compact?: boolean;
}) {
  const difficultyColors =
    DIFFICULTY_COLORS[recipe.difficulty] ?? DIFFICULTY_COLORS["Beginner Cook"];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
      style={({ pressed }) => [styles.card, shadowSm, width ? { width } : styles.horizontalCard, pressed && { opacity: 0.92 }]}
    >
      <View style={[styles.imageWrap, compact && styles.compactImage]}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.fill} resizeMode="cover" />
        ) : (
          <View style={[styles.fill, styles.imageFallback]}>
            <Text style={styles.fallbackText}>Image unavailable</Text>
          </View>
        )}
        {recipe.author ? (
          <Pressable
            onPress={onAuthorPress ? (event) => { event.stopPropagation(); onAuthorPress(); } : undefined}
            disabled={!onAuthorPress}
            style={styles.authorTag}
            accessibilityRole={onAuthorPress ? "button" : undefined}
            accessibilityLabel={onAuthorPress ? `Open ${recipe.author}'s profile` : undefined}
          >
            <Text style={styles.authorTagText}>{recipe.author}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>{recipe.title}</Text>
        {!compact ? (
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: difficultyColors.bg }]}>
              <Text numberOfLines={1} style={[styles.pillText, { color: difficultyColors.text }]}>{recipe.difficulty}</Text>
            </View>
            {recipe.time ? <Text style={styles.time}>{recipe.time}</Text> : null}
          </View>
        ) : null}
        {!compact && (recipe.likes > 0 || recipe.views > 0) ? (
          <View style={styles.statsRow}>
            <Text accessibilityLabel={`${recipe.likes} likes`} style={styles.stat}>♥ {formatCount(recipe.likes)} {recipe.likes === 1 ? "like" : "likes"}</Text>
            <Text accessibilityLabel={`${recipe.views} views`} style={styles.stat}>◉ {formatCount(recipe.views)} {recipe.views === 1 ? "view" : "views"}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  card: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  horizontalCard: { width: 176 },
  imageWrap: { height: 112, backgroundColor: colors.sageLight, overflow: "hidden" },
  compactImage: { height: 112 },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  fallbackText: { fontSize: 10, fontWeight: "500", color: colors.muted },
  authorTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  authorTagText: { fontSize: 10, fontWeight: "600", color: colors.ink },
  body: { padding: 10 },
  title: { fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 16, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: { maxWidth: "72%", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: "600" },
  time: { fontSize: 10, fontWeight: "500", color: colors.muted },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  stat: { fontSize: 9, fontWeight: "600", color: colors.muted },
});
