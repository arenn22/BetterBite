import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "@/components/ui/icon";

/** Small uppercase label used above every grouped section, optionally with a leading icon. */
export function SectionLabel({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <View style={styles.row}>
      {icon ? <AppIcon name={icon} size={12} color={colors.sage} weight="bold" /> : null}
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
});
