import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "./icon";

/** An icon centered in a soft tinted circle (section headings, empty states, list rows). */
export function IconBadge({
  name,
  size = 32,
  color = colors.sage,
  backgroundColor = colors.sageLight,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2.6, alignItems: "center", justifyContent: "center", backgroundColor },
        style,
      ]}
    >
      <AppIcon name={name} size={Math.round(size * 0.5)} color={color} weight="semibold" />
    </View>
  );
}
