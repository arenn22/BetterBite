import { Platform } from "react-native";

export const colors = {
  bg: "#F7F7F4",
  card: "#FFFFFF",
  ink: "#30312E",
  muted: "#85877D",
  faint: "#A7A99F",
  ghost: "#C4C6BC",
  border: "#D4D5CE",
  divider: "#E7E8E2",
  cream: "#F0E8DF",
  sage: "#687B5D",
  sageDark: "#55684B",
  sageLight: "#EAF0E6",
  sageMid: "#8A9E7A",
  clay: "#D9A28B",
  terracotta: "#C4855F",
  terraBg: "#FDF0EA",
  flame: "#E8733A",
  gold: "#D4A72C",
  silver: "#A3A8AE",
  bronze: "#B87A4B",
  danger: "#B42318",
  dangerBg: "#FDECEA",
} as const;

export const fonts = {
  heading: Platform.select({ ios: "Georgia", default: "serif" }) ?? "serif",
  headingSemi: Platform.select({ ios: "Georgia", default: "serif" }) ?? "serif",
} as const;

/** Shared corner radii so cards, inputs and chips line up across every screen. */
export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Horizontal page gutter and vertical rhythm used by every screen. */
export const layout = {
  gutter: 16,
  sectionGap: 24,
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

export const shadowLg = {
  shadowColor: "#30312E",
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;
