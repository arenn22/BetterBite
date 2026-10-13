import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";
import { AppIcon } from "@/components/ui/icon";
import { PressableScale } from "@/components/ui/pressable-scale";
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
                <PressableScale onPress={onClose} hitSlop={8} pressScale={0.88} style={styles.close} hoverStyle={styles.closeHover} accessibilityRole="button" accessibilityLabel="Close recipe preview">
                  <AppIcon name="close" size={14} color={colors.muted} weight="bold" />
                </PressableScale>
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
  close: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  closeHover: { backgroundColor: colors.divider },
  author: { marginTop: 8, fontSize: 12, fontWeight: "600", color: colors.muted },
  meta: { marginTop: 6, fontSize: 11, fontWeight: "600", color: colors.sage },
});
