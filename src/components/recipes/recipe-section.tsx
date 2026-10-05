import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/app/(tabs)/theme";
import { type RecipeCardData } from "@/lib/recipes";
import { RecipeCard } from "./recipe-card";

export function RecipeSection({
  icon,
  title,
  subtitle,
  recipes,
  loading,
  onOpen,
}: {
  icon: string;
  title: string;
  subtitle: string;
  recipes: RecipeCardData[];
  loading: boolean;
  onOpen: (recipe: RecipeCardData) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.icon}>{icon}</Text>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.sage} style={styles.loading} />
      ) : recipes.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onPress={() => onOpen(recipe)} />)}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No recipes to show yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  heading: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  icon: { fontSize: 20, marginTop: 2 },
  title: { fontSize: 14, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 12, fontWeight: "500", color: colors.muted, marginTop: 2 },
  loading: { height: 150 },
  cards: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  empty: { paddingHorizontal: 16, paddingVertical: 20, fontSize: 12, fontWeight: "500", color: colors.muted },
});
