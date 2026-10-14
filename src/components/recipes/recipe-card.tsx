import { useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

import { colors, radii, shadowSm } from "@/app/(tabs)/theme";
import { AppIcon } from "@/components/ui/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
import { DIFFICULTY_COLORS, formatCount, type RecipeCardData } from "@/lib/recipes";

export const RECIPE_CARD_WIDTH = Platform.OS === "web" ? 196 : 176;

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
  const [imageFailed, setImageFailed] = useState(false);
  const difficultyColors =
    DIFFICULTY_COLORS[recipe.difficulty] ?? DIFFICULTY_COLORS["Beginner Cook"];
  const cardWidth = width ?? RECIPE_CARD_WIDTH;

  return (
    <View style={[styles.card, shadowSm, { width: cardWidth }]}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${recipe.title}`}
        pressScale={0.97}
        hoverLift={4}
        style={styles.cardContent}
        hoverStyle={styles.cardHover}
      >
      <View style={styles.imageWrap}>
        {recipe.imageUrl && !imageFailed ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.fill} resizeMode="cover" onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.fill, styles.imageFallback]}>
            <AppIcon name="forkKnife" size={26} color={colors.sageMid} />
            <Text style={styles.fallbackText}>No photo yet</Text>
          </View>
        )}
        {recipe.time ? (
          <View style={styles.timeBadge}>
            <AppIcon name="clock" size={10} color={colors.ink} weight="semibold" />
            <Text style={styles.timeBadgeText}>{recipe.time}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>{recipe.title}</Text>
        {!compact ? (
          <View style={[styles.pill, { backgroundColor: difficultyColors.bg }]}>
            <Text numberOfLines={1} style={[styles.pillText, { color: difficultyColors.text }]}>{recipe.difficulty}</Text>
          </View>
        ) : null}
        {!compact ? (
          <View style={styles.statsRow}>
            <View style={styles.stat} accessibilityLabel={`${recipe.likes} likes`}>
              <AppIcon name="heartFill" size={11} color={colors.clay} />
              <Text style={styles.statText}>{formatCount(recipe.likes)}</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={`${recipe.views} views`}>
              <AppIcon name="eye" size={11} color={colors.faint} />
              <Text style={styles.statText}>{formatCount(recipe.views)}</Text>
            </View>
          </View>
        ) : null}
      </View>
      </PressableScale>
      {recipe.author ? (
        <PressableScale
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
          pressScale={0.92}
          style={[styles.authorTag, { top: cardWidth - 27 }]}
          hoverStyle={styles.authorTagHover}
          accessibilityRole={onAuthorPress ? "button" : undefined}
          accessibilityLabel={onAuthorPress ? `Open ${recipe.author}'s profile` : undefined}
        >
          <AppIcon name="profile" size={11} color={colors.sage} />
          <Text numberOfLines={1} style={styles.authorTagText}>{recipe.author}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  card: { position: "relative", borderRadius: radii.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  cardContent: { backgroundColor: colors.card },
  cardHover: { backgroundColor: colors.bg },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.sageLight, overflow: "hidden" },
  imageFallback: { alignItems: "center", justifyContent: "center", gap: 6 },
  fallbackText: { fontSize: 10, fontWeight: "600", color: colors.muted },
  timeBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.92)" },
  timeBadgeText: { fontSize: 10, fontWeight: "700", color: colors.ink },
  authorTag: { position: "absolute", left: 8, maxWidth: "85%", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  authorTagHover: { backgroundColor: "#FFFFFF" },
  authorTagText: { flexShrink: 1, fontSize: 10, fontWeight: "700", color: colors.ink },
  body: { padding: 10, gap: 6 },
  title: { minHeight: 34, fontSize: 13, fontWeight: "700", color: colors.ink, lineHeight: 17 },
  pill: { alignSelf: "flex-start", maxWidth: "100%", paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.pill },
  pillText: { fontSize: 10, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 10, fontWeight: "700", color: colors.muted },
});
