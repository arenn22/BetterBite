import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors, radii } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "./icon";
import { PressableScale, type PressableScaleProps } from "./pressable-scale";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { container: ViewStyle; hover: ViewStyle; text: string }> = {
  primary: {
    container: { backgroundColor: colors.sage, borderColor: colors.sage },
    hover: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
    text: "#FFFFFF",
  },
  secondary: {
    container: { backgroundColor: colors.sageLight, borderColor: colors.sageLight },
    hover: { backgroundColor: "#DCE6D6", borderColor: "#DCE6D6" },
    text: colors.sage,
  },
  outline: {
    container: { backgroundColor: colors.card, borderColor: colors.border },
    hover: { backgroundColor: colors.bg, borderColor: colors.sageMid },
    text: colors.ink,
  },
  danger: {
    container: { backgroundColor: colors.card, borderColor: colors.clay },
    hover: { backgroundColor: colors.terraBg, borderColor: colors.terracotta },
    text: colors.terracotta,
  },
  ghost: {
    container: { backgroundColor: "transparent", borderColor: "transparent" },
    hover: { backgroundColor: colors.sageLight, borderColor: colors.sageLight },
    text: colors.sage,
  },
};

const SIZES: Record<Size, { container: ViewStyle; font: number; icon: number }> = {
  sm: { container: { minHeight: 34, paddingHorizontal: 12, gap: 6 }, font: 12, icon: 14 },
  md: { container: { minHeight: 44, paddingHorizontal: 16, gap: 8 }, font: 14, icon: 16 },
  lg: { container: { minHeight: 52, paddingHorizontal: 20, gap: 8 }, font: 15, icon: 18 },
};

export type ButtonProps = Omit<PressableScaleProps, "children" | "style"> & {
  title: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const dimensions = SIZES[size];
  const isDisabled = Boolean(disabled) || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      pressScale={0.97}
      hoverLift={variant === "primary" ? 1 : 0}
      style={[
        styles.base,
        dimensions.container,
        palette.container,
        variant === "primary" && styles.primaryShadow,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      hoverStyle={palette.hover}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : icon ? (
        <AppIcon name={icon} size={dimensions.icon} color={palette.text} weight="semibold" />
      ) : null}
      <Text numberOfLines={1} style={[styles.text, { color: palette.text, fontSize: dimensions.font }]}>{title}</Text>
      {iconRight && !loading ? <AppIcon name={iconRight} size={dimensions.icon} color={palette.text} weight="semibold" /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: 1,
  },
  primaryShadow: {
    shadowColor: colors.sage,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.55 },
  text: { fontWeight: "800" },
});
