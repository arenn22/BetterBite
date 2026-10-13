import type { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, fonts, layout } from "@/app/(tabs)/theme";

export function ScreenHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  const showEyebrow = Boolean(eyebrow?.trim());
  const showSubtitle = Boolean(subtitle?.trim());

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          {showEyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {showSubtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === "ios" ? 18 : 12, paddingBottom: 14, paddingHorizontal: layout.gutter },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copy: { flex: 1, paddingRight: 12 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4, lineHeight: 21 },
});
