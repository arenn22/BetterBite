import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/** Fades and slides content up when it first mounts; stagger siblings with `delay`. */
export function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.duration(240).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
