import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/app/(tabs)/theme";

export function ScreenHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  copy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4, lineHeight: 21 },
});
