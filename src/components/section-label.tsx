import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "@/app/(tabs)/theme";

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
});
