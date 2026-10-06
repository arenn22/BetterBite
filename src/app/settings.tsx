import { ScreenHeader } from "@/components/screen-header";
import { useAuthContext } from "@/lib/auth/auth-context";
import { Href, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, shadowSm } from "./(tabs)/theme";

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text numberOfLines={1} style={styles.rowValue}>{value}</Text> : null}
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

export default function SettingsScreen() {
  const { currentUser, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      router.replace("/login" as Href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign out.");
      setSigningOut(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScreenHeader
        eyebrow="Your account"
        title="Settings"
        subtitle="Manage your account and app session."
        action={
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.back}>Back</Text>
          </Pressable>
        }
      />

      <View style={[styles.section, shadowSm]}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingRow label="Username" value={currentUser?.username || "BetterBite member"} />
        <View style={styles.divider} />
        <SettingRow label="Email" value={currentUser?.email || "Not available"} />
      </View>

      <View style={[styles.section, shadowSm]}>
        <Text style={styles.sectionTitle}>Session</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed, signingOut && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ disabled: signingOut }}
        >
          {signingOut ? <ActivityIndicator color={colors.terracotta} /> : <Text style={styles.signOutText}>Sign out</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  back: { marginTop: 8, color: colors.sage, fontSize: 12, fontWeight: "800" },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", overflow: "hidden" },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
  row: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  rowValue: { marginTop: 3, fontSize: 12, color: colors.muted },
  chevron: { marginLeft: 12, fontSize: 24, fontWeight: "300", color: colors.faint },
  divider: { height: 1, marginHorizontal: 16, backgroundColor: colors.cream },
  signOutButton: { minHeight: 52, alignItems: "center", justifyContent: "center", margin: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.clay, backgroundColor: "#fff" },
  signOutText: { fontSize: 14, fontWeight: "800", color: colors.terracotta },
  error: { paddingHorizontal: 16, paddingTop: 8, fontSize: 12, color: colors.terracotta },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
});
