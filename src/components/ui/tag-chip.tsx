import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/app/(tabs)/theme";
import { getTagVisual, type TagKind, type TagVisual } from "@/constants/tag-icons";
import { AppIcon, type IconName } from "./icon";
import { PressableScale } from "./pressable-scale";

export type TagChipProps = {
  label: string;
  /** Picks a matching dietary / cuisine icon automatically. */
  kind?: TagKind;
  /** Explicit icon; overrides `kind`. */
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
};

const NEUTRAL: Omit<TagVisual, "icon"> = { tint: colors.sage, bg: colors.sageLight };

/**
 * The single chip style used for filters, dietary/cuisine pickers and recipe tags.
 * Each chip shows its icon in a soft colored dot that turns white when selected.
 */
export function TagChip({ label, kind, icon, selected = false, onPress, size = "md" }: TagChipProps) {
  const visual = kind ? getTagVisual(label, kind) : null;
  const iconName = icon ?? visual?.icon;
  const { tint, bg } = visual ?? NEUTRAL;
  const small = size === "sm";

  const content = (
    <>
      {iconName ? (
        <View style={[styles.iconDot, small && styles.iconDotSmall, { backgroundColor: selected ? "rgba(255,255,255,0.22)" : bg }]}>
          <AppIcon name={iconName} size={small ? 11 : 13} color={selected ? "#FFFFFF" : tint} weight="semibold" />
        </View>
      ) : null}
      <Text numberOfLines={1} style={[styles.label, small && styles.labelSmall, selected && styles.labelSelected]}>{label}</Text>
      {selected && onPress ? <AppIcon name="check" size={small ? 10 : 12} color="#FFFFFF" weight="bold" /> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.chip, small && styles.chipSmall, styles.staticChip]}>{content}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      pressScale={0.94}
      style={[styles.chip, small && styles.chipSmall, selected && styles.chipSelected]}
      hoverStyle={selected ? styles.chipSelectedHover : styles.chipHover}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSmall: { gap: 5, paddingLeft: 4, paddingRight: 10, paddingVertical: 4 },
  staticChip: { borderColor: colors.divider },
  chipHover: { borderColor: colors.sageMid, backgroundColor: colors.bg },
  chipSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  chipSelectedHover: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  iconDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  iconDotSmall: { width: 20, height: 20, borderRadius: 10 },
  label: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: colors.ink },
  labelSmall: { fontSize: 11 },
  labelSelected: { color: "#FFFFFF" },
});
