import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";
import type { RecipeCardData } from "@/lib/recipes";

export function RecipePreviewModal({
  recipe,
  visible,
  onClose,
}: {
  recipe: RecipeCardData | null;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close recipe preview" />
        {recipe ? (
          <View style={[styles.card, shadowSm]}>
            {recipe.imageUrl ? <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" /> : null}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{recipe.title}</Text>
                <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close recipe preview">
                  <Text style={styles.close}>×</Text>
                </Pressable>
              </View>
              {recipe.author ? <Text style={styles.author}>by {recipe.author}</Text> : null}
              {recipe.time ? <Text style={styles.meta}>{recipe.difficulty} · {recipe.time}</Text> : null}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", paddingHorizontal: 20, backgroundColor: "rgba(0,0,0,0.45)" },
  card: { width: "100%", maxWidth: 390, alignSelf: "center", overflow: "hidden", borderRadius: 16, backgroundColor: "#fff" },
  image: { width: "100%", height: 220, backgroundColor: colors.sageLight },
  content: { padding: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { flex: 1, marginRight: 12, fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  close: { fontSize: 28, lineHeight: 30, color: colors.muted },
  author: { marginTop: 8, fontSize: 12, fontWeight: "600", color: colors.muted },
  meta: { marginTop: 6, fontSize: 11, fontWeight: "600", color: colors.sage },
});
