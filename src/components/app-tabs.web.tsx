import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/app/(tabs)/theme";

export default function AppTabs() {
  return (
    <View style={styles.webShell}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>B</Text></View>
          <Text style={styles.brandName}>BetterBite</Text>
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
              <TabTrigger name="social" href="/social" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="create" href="/create" asChild>
                <Pressable />
              </TabTrigger>
              <TabTrigger name="profile" href="/profile" asChild>
                <Pressable />
              </TabTrigger>
            </View>
          </TabList>
        </Tabs>
    </View>
  );
}

const NAV_ITEMS = [
  { label: "Home", icon: "⌂", path: "/home" },
  { label: "Explore", icon: "⌕", path: "/explore" },
  { label: "Social", icon: "♧", path: "/social" },
  { label: "Create", icon: "＋", path: "/create" },
  { label: "Profile", icon: "◎", path: "/profile" },
] as const;

function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <View style={styles.navigation}>
      <View style={styles.navItems}>
        {NAV_ITEMS.map((item) => {
          const isFocused = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && styles.focusedButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.icon, isFocused && styles.focusedText]}>{item.icon}</Text>
              <Text style={[styles.label, isFocused && styles.focusedText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => router.push("/settings")}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [
          styles.settingsButton,
          pathname === "/settings" && styles.focusedButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.icon, pathname === "/settings" && styles.focusedText]}>⚙</Text>
        <Text style={[styles.label, pathname === "/settings" && styles.focusedText]}>Settings</Text>
      </Pressable>
    </View>
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
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 34,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
  },
  brandMarkText: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    fontSize: 21,
  },
  brandName: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 21,
  },
  navigation: {
    flex: 1,
    justifyContent: "space-between",
  },
  navItems: {
    gap: 8,
    paddingTop: 4,
  },
  hiddenTabList: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    minHeight: 46,
    width: "100%",
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  appFrame: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bg,
  },
  tabSlot: {
    flex: 1,
    width: "100%",
  },
  settingsButton: {
    minHeight: 46,
    width: "100%",
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
  },
  focusedButton: {
    backgroundColor: colors.sageLight,
  },
  icon: {
    width: 22,
    color: colors.muted,
    fontSize: 21,
    textAlign: "center",
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
