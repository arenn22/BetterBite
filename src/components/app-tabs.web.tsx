import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { router, usePathname } from "expo-router";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, fonts, radii } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { PressableScale } from "@/components/ui/pressable-scale";

export default function AppTabs() {
  return (
    <View style={styles.webShell}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Image
              source={require("@/assets/images/betterbite-icon.svg")}
              style={styles.brandMarkImage}
              contentFit="contain"
            />
          </View>
          <View>
            <Text style={styles.brandName}>BetterByte</Text>
            <Text style={styles.brandTagline}>Cook smarter</Text>
          </View>
        </View>

        <SidebarNavigation />
      </View>

      <Tabs style={styles.appFrame}>
          <TabSlot style={styles.tabSlot} />
          <TabList asChild>
            <View style={styles.hiddenTabList}>
              <TabTrigger name="home" href="/home" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="explore" href="/explore" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="create" href="/create" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="social" href="/social" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="profile" href="/profile" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="settings" href="/settings" asChild>
                <Pressable />
              </TabTrigger>
            </View>
          </TabList>
        </Tabs>
    </View>
  );
}

const NAV_ITEMS: { label: string; icon: IconName; path: "/home" | "/explore" | "/create" | "/social" | "/profile" }[] = [
  { label: "Home", icon: "home", path: "/home" },
  { label: "Explore", icon: "explore", path: "/explore" },
  { label: "Create", icon: "create", path: "/create" },
  { label: "Social", icon: "social", path: "/social" },
  { label: "Profile", icon: "profile", path: "/profile" },
];

const NAV_ITEM_HEIGHT = 46;
const NAV_ITEM_GAP = 6;
/** Quick, bounce-free slide for the active-tab highlight. */
const INDICATOR_TIMING = { duration: 160, easing: Easing.out(Easing.cubic) };

function SidebarNavigation() {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  const indicatorY = useSharedValue(Math.max(activeIndex, 0) * (NAV_ITEM_HEIGHT + NAV_ITEM_GAP));
  const indicatorOpacity = useSharedValue(activeIndex >= 0 ? 1 : 0);

  useEffect(() => {
    if (activeIndex >= 0) {
      indicatorY.value = withTiming(activeIndex * (NAV_ITEM_HEIGHT + NAV_ITEM_GAP), INDICATOR_TIMING);
    }
    indicatorOpacity.value = withTiming(activeIndex >= 0 ? 1 : 0, INDICATOR_TIMING);
  }, [activeIndex, indicatorOpacity, indicatorY]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ translateY: indicatorY.value }],
  }));

  return (
    <View style={styles.navigation}>
      <View>
        <Text style={styles.navHeading}>Menu</Text>
        <View style={styles.navItems}>
          <Animated.View pointerEvents="none" style={[styles.activeIndicator, indicatorStyle]}>
            <View style={styles.activeBar} />
          </Animated.View>
          {NAV_ITEMS.map((item, index) => (
            <NavButton
              key={item.path}
              label={item.label}
              icon={item.icon}
              focused={index === activeIndex}
              onPress={() => router.push(item.path)}
            />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <NavButton
          label="Settings"
          icon="settings"
          focused={pathname === "/settings"}
          highlightFocused
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}

function NavButton({
  label,
  icon,
  focused,
  highlightFocused = false,
  onPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  /** Draw the active background directly (for items outside the animated indicator). */
  highlightFocused?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      pressScale={0.97}
      style={[styles.tabButton, highlightFocused && focused && styles.focusedButton]}
      hoverStyle={focused ? null : styles.hoveredButton}
    >
      <View style={styles.iconBox}>
        <AppIcon name={icon} size={20} color={focused ? colors.sage : colors.muted} weight={focused ? "semibold" : "medium"} />
      </View>
      <Text style={[styles.label, focused && styles.focusedText]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E9EAE5",
  },
  sidebar: {
    width: 240,
    height: "100%",
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 2, height: 0 },
    elevation: 3,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
    shadowColor: colors.sage,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  brandMarkImage: {
    width: "100%",
    height: "100%",
    borderRadius: radii.sm,
  },
  brandName: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 24,
  },
  brandTagline: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "600",
  },
  navigation: {
    flex: 1,
    justifyContent: "space-between",
  },
  navHeading: {
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 10,
    fontWeight: "800",
    color: colors.faint,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  navItems: {
    position: "relative",
    gap: NAV_ITEM_GAP,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_ITEM_HEIGHT,
    borderRadius: radii.md,
    backgroundColor: colors.sageLight,
    justifyContent: "center",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.sage,
  },
  hiddenTabList: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    pointerEvents: "none",
  },
  tabButton: {
    height: NAV_ITEM_HEIGHT,
    width: "100%",
    paddingHorizontal: 14,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hoveredButton: {
    backgroundColor: colors.bg,
  },
  appFrame: {
    flex: 1,
    minWidth: 0,
    width: "auto",
    paddingHorizontal: 32,
    backgroundColor: colors.bg,
  },
  tabSlot: {
    flex: 1,
    width: "100%",
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  focusedButton: {
    backgroundColor: colors.sageLight,
  },
  iconBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  focusedText: {
    color: colors.sage,
  },
});
