import { ScreenHeader } from "@/components/screen-header";
import { useRecipeOptions } from "@/hooks/use-recipe-options";
import { useAuthContext } from "@/lib/auth/auth-context";
import {
  set_my_dietary_restrictions,
  updateNotificationPreferences,
  updatePassword,
  updateProfilePhoto,
  updateProfileUsername,
} from "@/services/api/profiles";
import { colors, fonts, shadowSm } from "@/app/(tabs)/theme";
import { Href, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={[styles.section, shadowSm]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const { currentUser, refreshCurrentUser, signOut } = useAuthContext();
  const { dietaryOptions, loading: optionsLoading } = useRecipeOptions();
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [password, setPassword] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>(
    currentUser?.dietary_restrictions ?? currentUser?.dietaryRestrictions ?? [],
  );
  const [notifyStreaks, setNotifyStreaks] = useState(
    currentUser?.notify_streaks ?? true,
  );
  const [notifyFriends, setNotifyFriends] = useState(
    currentUser?.notify_friend_activity ?? true,
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(currentUser?.username ?? "");
    setSelectedRestrictions(currentUser?.dietary_restrictions ?? currentUser?.dietaryRestrictions ?? []);
  }, [currentUser]);

  const selectedNames = useMemo(
    () => dietaryOptions.filter((option) => selectedRestrictions.includes(option.id)).map((option) => option.name),
    [dietaryOptions, selectedRestrictions],
  );

  const runSave = async (key: string, action: () => Promise<void>, success: string) => {
    setSaving(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      await refreshCurrentUser();
      setMessage(success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your changes.");
    } finally {
      setSaving(null);
    }
  };

  const choosePhoto = async () => {
    if (!currentUser) return;
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        await runSave("photo", async () => {
          const url = await updateProfilePhoto(currentUser.id, result.assets[0].uri);
          if (!url) throw new Error("The profile photo upload did not return a URL.");
        }, "Profile photo updated.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open your photo library.");
    }
  };

  const toggleRestriction = (id: number) => {
    setSelectedRestrictions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <ScreenHeader
          eyebrow="Your account"
          title="Settings"
          subtitle="Keep your profile and BetterBite preferences up to date."
          action={<Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>Back</Text></Pressable>}
        />

        <Section title="Profile">
          <View style={styles.profileRow}>
            {currentUser?.pfp_url ? <Image source={{ uri: currentUser.pfp_url }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(username[0] ?? "B").toUpperCase()}</Text></View>}
            <View style={styles.profileCopy}><Text style={styles.profileName}>{username || "BetterBite member"}</Text><Text style={styles.rowValue}>{currentUser?.email || "Email unavailable"}</Text></View>
            <Pressable onPress={() => void choosePhoto()} disabled={saving === "photo"} style={styles.smallButton}><Text style={styles.smallButtonText}>{saving === "photo" ? "..." : "Change"}</Text></Pressable>
          </View>
          <Divider />
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputRow}><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={styles.input} placeholder="Username" placeholderTextColor={colors.faint} /><Pressable onPress={() => currentUser && void runSave("username", () => updateProfileUsername(currentUser.id, username.trim()), "Username updated.")} disabled={!currentUser || !username.trim() || saving === "username"}><Text style={styles.saveText}>{saving === "username" ? "..." : "Save"}</Text></Pressable></View>
          <Text style={styles.joined}>Member since {currentUser?.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : "—"}</Text>
        </Section>

        <Section title="Password">
          <Text style={styles.helper}>Choose a new password for your BetterBite account.</Text>
          <View style={styles.inputRow}><TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="New password" placeholderTextColor={colors.faint} /><Pressable onPress={() => void runSave("password", async () => { if (password.length < 6) throw new Error("Password must be at least 6 characters."); await updatePassword(password); setPassword(""); }, "Password updated.")} disabled={!password || saving === "password"}><Text style={styles.saveText}>{saving === "password" ? "..." : "Update"}</Text></Pressable></View>
        </Section>

        <Section title="Dietary restrictions">
          <Text style={styles.helper}>Personalize recipe suggestions with the restrictions that apply to you.</Text>
          {optionsLoading ? <ActivityIndicator color={colors.sage} style={styles.loader} /> : <View style={styles.chips}>{dietaryOptions.map((option) => { const selected = selectedRestrictions.includes(option.id); return <Pressable key={option.id} onPress={() => toggleRestriction(option.id)} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.name}</Text></Pressable>; })}</View>}
          {selectedNames.length > 0 ? <Text style={styles.selectedSummary}>Selected: {selectedNames.join(", ")}</Text> : null}
          <Pressable onPress={() => void runSave("diet", () => set_my_dietary_restrictions(selectedRestrictions), "Dietary restrictions updated.")} disabled={saving === "diet"} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{saving === "diet" ? "Saving..." : "Save restrictions"}</Text></Pressable>
        </Section>

        <Section title="Notifications">
          <View style={styles.settingRow}><View style={styles.rowCopy}><Text style={styles.rowLabel}>Streak reminders</Text><Text style={styles.rowValue}>Get updates about your daily streak.</Text></View><Switch value={notifyStreaks} onValueChange={(value) => { setNotifyStreaks(value); void runSave("notifications", () => updateNotificationPreferences(value, notifyFriends), "Notification preferences updated."); }} trackColor={{ false: colors.border, true: colors.sageLight }} thumbColor={notifyStreaks ? colors.sage : colors.faint} /></View>
          <Divider />
          <View style={styles.settingRow}><View style={styles.rowCopy}><Text style={styles.rowLabel}>Friend activity</Text><Text style={styles.rowValue}>Know when friends share and cook.</Text></View><Switch value={notifyFriends} onValueChange={(value) => { setNotifyFriends(value); void runSave("notifications", () => updateNotificationPreferences(notifyStreaks, value), "Notification preferences updated."); }} trackColor={{ false: colors.border, true: colors.sageLight }} thumbColor={notifyFriends ? colors.sage : colors.faint} /></View>
        </Section>

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Section title="Session">
          <Pressable onPress={() => void runSave("signout", async () => { await signOut(); router.replace("/login" as Href); }, "Signed out.")} disabled={saving === "signout"} style={styles.outlineButton}><Text style={styles.signOutText}>{saving === "signout" ? "Signing out..." : "Sign out"}</Text></Pressable>
        </Section>
        <Pressable style={styles.deleteButton} accessibilityRole="button" accessibilityLabel="Delete account"><Text style={styles.deleteText}>Delete account</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  page: { width: "100%", maxWidth: 1080, alignSelf: "center" },
  back: { marginTop: 8, color: colors.sage, fontSize: 12, fontWeight: "800" },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", overflow: "hidden" },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
  profileRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 8 },
  profileCopy: { flex: 1, marginHorizontal: 12 },
  profileName: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sageLight },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.sageLight },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.sage },
  smallButton: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: colors.sage, fontSize: 12, fontWeight: "800" },
  divider: { height: 1, marginHorizontal: 16, backgroundColor: colors.divider },
  inputLabel: { marginHorizontal: 16, marginTop: 14, fontSize: 11, fontWeight: "800", color: colors.muted },
  inputRow: { minHeight: 50, flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  saveText: { color: colors.sage, fontSize: 12, fontWeight: "800" },
  joined: { padding: 16, paddingTop: 10, color: colors.muted, fontSize: 11 },
  helper: { paddingHorizontal: 16, paddingBottom: 8, color: colors.muted, fontSize: 12, lineHeight: 18 },
  loader: { padding: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16, paddingTop: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#fff" },
  chipSelected: { borderColor: colors.sage, backgroundColor: colors.sageLight },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: colors.sage },
  selectedSummary: { paddingHorizontal: 16, paddingBottom: 10, color: colors.muted, fontSize: 11 },
  primaryButton: { alignItems: "center", margin: 16, marginTop: 4, borderRadius: 12, paddingVertical: 13, backgroundColor: colors.sage },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  settingRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  rowCopy: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  rowValue: { marginTop: 3, fontSize: 12, color: colors.muted },
  outlineButton: { minHeight: 52, alignItems: "center", justifyContent: "center", margin: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.clay },
  signOutText: { fontSize: 14, fontWeight: "800", color: colors.terracotta },
  deleteButton: { alignItems: "center", paddingVertical: 12, marginBottom: 8 },
  deleteText: { color: colors.terracotta, fontSize: 13, fontWeight: "800" },
  message: { marginHorizontal: 20, marginBottom: 12, color: colors.sage, fontSize: 12, fontWeight: "700" },
  error: { marginHorizontal: 20, marginBottom: 12, color: colors.terracotta, fontSize: 12, fontWeight: "700" },
});
