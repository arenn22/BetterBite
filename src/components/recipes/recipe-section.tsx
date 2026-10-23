import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, layout } from "@/app/(tabs)/theme";
import { FadeIn } from "@/components/ui/fade-in";
import { IconBadge } from "@/components/ui/icon-badge";
import type { IconName } from "@/components/ui/icon";
import { type RecipeCardData } from "@/lib/recipes";
import { RecipeCard } from "./recipe-card";

export function RecipeSection({
  icon,
  iconColor = colors.sage,
  iconBackground = colors.sageLight,
  title,
  recipes,
  loading,
  onOpen,
  onAuthorPress,
}: {
  icon: IconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  recipes: RecipeCardData[];
  loading: boolean;
  onOpen: (recipe: RecipeCardData) => void;
  onAuthorPress?: (recipe: RecipeCardData) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <IconBadge name={icon} size={34} color={iconColor} backgroundColor={iconBackground} />
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.sage} style={styles.loading} />
      ) : recipes.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {recipes.map((recipe, index) => (
            <FadeIn key={recipe.id} delay={Math.min(index, 6) * 60}>
              <RecipeCard recipe={recipe} onPress={() => onOpen(recipe)} onAuthorPress={onAuthorPress ? () => onAuthorPress(recipe) : undefined} />
            </FadeIn>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyRow}>
          <Text style={styles.empty}>No recipes to show yet.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: layout.sectionGap },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: layout.gutter, marginBottom: 12 },
  headingCopy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800", color: colors.ink },
  loading: { height: 150 },
  // Vertical padding leaves room for the card hover lift and shadow.
  cards: { paddingHorizontal: layout.gutter, paddingTop: 6, paddingBottom: 10, gap: 12 },
  emptyRow: { marginHorizontal: layout.gutter, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border },
  empty: { fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "center" },
});
