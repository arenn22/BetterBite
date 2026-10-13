import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, radii } from "@/app/(tabs)/theme";

/** Rounded progress track whose fill animates smoothly to `progress` (0–1). */
export function ProgressBar({ progress, height = 6, color = colors.sage }: { progress: number; height?: number; color?: string }) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", borderRadius: radii.pill, backgroundColor: colors.divider, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.pill },
});
