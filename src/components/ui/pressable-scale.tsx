import { useState } from "react";
import {
  Platform,
  Pressable,
  type GestureResponderEvent,
  type MouseEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 26, stiffness: 420, mass: 0.6 };

/** Smooth color/shadow changes on web when hover or selection styles swap in. */
const WEB_TRANSITION = Platform.OS === "web"
  ? ({
      cursor: "pointer",
      transitionProperty: "background-color, border-color, box-shadow, opacity, color",
      transitionDuration: "180ms",
      transitionTimingFunction: "ease-out",
    } as unknown as ViewStyle)
  : null;

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Extra style applied while a mouse hovers (web). */
  hoverStyle?: StyleProp<ViewStyle>;
  /** Extra style applied while pressed. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Scale while pressed. */
  pressScale?: number;
  /** Scale while hovered (web). */
  hoverScale?: number;
  /** Pixels to rise while hovered (web). */
  hoverLift?: number;
};

/**
 * Drop-in Pressable with a springy press-down, an optional hover lift on web,
 * and hover/pressed style hooks. Used for every tappable surface in the app.
 */
export function PressableScale({
  style,
  hoverStyle,
  pressedStyle,
  pressScale = 0.96,
  hoverScale = 1,
  hoverLift = 0,
  disabled,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  children,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDisabled = Boolean(disabled);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  const settle = (isHovered: boolean) => {
    scale.value = withSpring(isHovered ? hoverScale : 1, SPRING);
    lift.value = withSpring(isHovered ? -hoverLift : 0, SPRING);
  };

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event: GestureResponderEvent) => {
        setPressed(true);
        if (!isDisabled) scale.value = withSpring(pressScale, SPRING);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        setPressed(false);
        settle(hovered && !isDisabled);
        onPressOut?.(event);
      }}
      onHoverIn={(event: MouseEvent) => {
        setHovered(true);
        if (!isDisabled) settle(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event: MouseEvent) => {
        setHovered(false);
        settle(false);
        onHoverOut?.(event);
      }}
      style={[
        WEB_TRANSITION,
        isDisabled && Platform.OS === "web" ? ({ cursor: "default" } as unknown as ViewStyle) : null,
        style,
        hovered && !isDisabled ? hoverStyle : null,
        pressed && !isDisabled ? pressedStyle : null,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
