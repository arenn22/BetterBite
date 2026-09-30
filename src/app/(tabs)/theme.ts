import { Platform } from "react-native";

export const colors = {
  bg: "#F7F7F4",
  ink: "#30312E",
  muted: "#85877D",
  faint: "#A7A99F",
  ghost: "#C4C6BC",
  border: "#D4D5CE",
  divider: "#E7E8E2",
  cream: "#F0E8DF",
  sage: "#687B5D",
  sageLight: "#EAF0E6",
  clay: "#D9A28B",
  terracotta: "#C4855F",
} as const;

export const fonts = {
  heading: Platform.select({ ios: "Georgia", default: "serif" }) ?? "serif",
  headingSemi: Platform.select({ ios: "Georgia", default: "serif" }) ?? "serif",
} as const;

export const shadowSm = {
  shadowColor: "#30312E",
  shadowOpacity: 0.08,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

export const shadowMd = {
  shadowColor: "#30312E",
  shadowOpacity: 0.14,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;
