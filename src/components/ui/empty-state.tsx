import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors, fonts } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "./icon";

/** Shared empty / error placeholder: icon in a dashed ring, title, message and optional action. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  tone = "neutral",
}: {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  const tint = tone === "error" ? colors.terracotta : colors.clay;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.root}>
      <View style={[styles.ring, { borderColor: tint }]}>
        <View style={[styles.circle, tone === "error" && styles.errorCircle]}>
          <AppIcon name={icon} size={24} color={tone === "error" ? colors.terracotta : colors.sage} weight="semibold" />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  circle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream },
  errorCircle: { backgroundColor: colors.terraBg },
  title: { fontFamily: fonts.headingSemi, fontSize: 17, color: colors.ink, marginBottom: 4, textAlign: "center" },
  message: { fontSize: 13, fontWeight: "500", color: colors.muted, lineHeight: 19, textAlign: "center", maxWidth: 300 },
  action: { marginTop: 14 },
});
