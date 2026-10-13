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
import { colors, fonts, layout, radii, shadowSm } from "@/app/(tabs)/theme";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { AppIcon, type IconName } from "@/components/ui/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import { TagChip } from "@/components/ui/tag-chip";
import { Href, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

function Section({ title, icon, delay = 0, children }: { title: string; icon: IconName; delay?: number; children: ReactNode }) {
  return (
    <FadeIn delay={delay} style={[styles.section, shadowSm]}>
      <View style={styles.sectionHeader}>
        <AppIcon name={icon} size={13} color={colors.sage} weight="bold" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </FadeIn>
  );
}

function FieldRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <AppIcon name={icon} size={15} color={colors.muted} />
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

  const usernameSaveDisabled = !currentUser || username.trim().length < 4 || username.trim() === currentUser.username || saving === "username";
  const passwordSaveDisabled = !currentUser || password.length < 6 || saving === "password";

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <ScreenHeader
          title="Settings"
          action={<Button title="Back" icon="back" variant="outline" size="sm" onPress={() => router.back()} accessibilityLabel="Go back" />}
        />

        <Section title="Profile" icon="profile" delay={40}>
          <View style={styles.profileRow}>
            {currentUser?.pfp_url ? <Image source={{ uri: currentUser.pfp_url }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(username[0] ?? "B").toUpperCase()}</Text></View>}
            <View style={styles.profileCopy}><Text style={styles.profileName}>{username || "BetterBite member"}</Text><Text style={styles.rowValue}>{currentUser?.email || "Email unavailable"}</Text></View>
            <Button title="Change" icon="camera" variant="outline" size="sm" loading={saving === "photo"} onPress={() => void choosePhoto()} />
          </View>
          <Divider />
          <Text style={styles.inputLabel}>Username</Text>
          <FieldRow icon="profile">
            <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={30} style={styles.input} placeholder="Username" placeholderTextColor={colors.faint} accessibilityLabel="Username" />
            <Button title={saving === "username" ? "Saving..." : "Save"} variant="ghost" size="sm" disabled={usernameSaveDisabled} onPress={() => void runSave("username", () => updateProfileUsername(username), "Username updated.")} />
          </FieldRow>
          {username.trim().length > 0 && username.trim().length < 4 ? <Text style={styles.fieldError}>Username must be at least 4 characters.</Text> : null}
          <View style={styles.joinedRow}>
            <AppIcon name="clock" size={12} color={colors.faint} />
            <Text style={styles.joined}>Member since {currentUser?.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : "—"}</Text>
          </View>
        </Section>

        <Section title="Password" icon="lock" delay={80}>
          <Text style={styles.helper}>Choose a new password for your BetterBite account.</Text>
          <FieldRow icon="lock">
            <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="New password" placeholderTextColor={colors.faint} accessibilityLabel="New password" />
            <Button title={saving === "password" ? "Updating..." : "Update"} variant="ghost" size="sm" disabled={passwordSaveDisabled} onPress={() => void runSave("password", async () => { await updatePassword(password); setPassword(""); }, "Password updated.")} />
          </FieldRow>
          {password.length > 0 && password.length < 6 ? <Text style={styles.fieldError}>Password must be at least 6 characters.</Text> : null}
          <View style={{ height: 12 }} />
        </Section>

        <Section title="Dietary restrictions" icon="leaf" delay={120}>
          <Text style={styles.helper}>Personalize recipe suggestions with the restrictions that apply to you.</Text>
          {optionsLoading ? <ActivityIndicator color={colors.sage} style={styles.loader} /> : (
            <View style={styles.chips}>
              {dietaryOptions.map((option) => (
                <TagChip key={option.id} kind="dietary" label={option.name} selected={selectedRestrictions.includes(option.id)} onPress={() => toggleRestriction(option.id)} />
              ))}
            </View>
          )}
          {selectedNames.length > 0 ? <Text style={styles.selectedSummary}>Selected: {selectedNames.join(", ")}</Text> : null}
          <View style={styles.sectionAction}>
            <Button title="Save restrictions" icon="check" loading={saving === "diet"} onPress={() => void runSave("diet", () => set_my_dietary_restrictions(selectedRestrictions), "Dietary restrictions updated.")} fullWidth />
          </View>
        </Section>

        <Section title="Notifications" icon="bell" delay={160}>
          <View style={styles.settingRow}>
            <IconBadge name="flame" size={34} color={colors.flame} backgroundColor={colors.terraBg} />
            <View style={styles.rowCopy}><Text style={styles.rowLabel}>Streak reminders</Text><Text style={styles.rowValue}>Get updates about your daily streak.</Text></View>
            <Switch value={notifyStreaks} onValueChange={(value) => { setNotifyStreaks(value); void runSave("notifications", () => updateNotificationPreferences(value, notifyFriends), "Notification preferences updated."); }} trackColor={{ false: colors.border, true: colors.sageMid }} thumbColor={notifyStreaks ? colors.sage : "#fff"} />
          </View>
          <Divider />
          <View style={styles.settingRow}>
            <IconBadge name="social" size={34} color="#4A7A99" backgroundColor="#E3EEF4" />
            <View style={styles.rowCopy}><Text style={styles.rowLabel}>Friend activity</Text><Text style={styles.rowValue}>Know when friends share and cook.</Text></View>
            <Switch value={notifyFriends} onValueChange={(value) => { setNotifyFriends(value); void runSave("notifications", () => updateNotificationPreferences(notifyStreaks, value), "Notification preferences updated."); }} trackColor={{ false: colors.border, true: colors.sageMid }} thumbColor={notifyFriends ? colors.sage : "#fff"} />
          </View>
        </Section>

        {message ? (
          <Animated.View entering={FadeInDown.duration(220)} style={[styles.banner, styles.successBanner]}>
            <AppIcon name="checkCircle" size={15} color={colors.sage} />
            <Text style={styles.message}>{message}</Text>
          </Animated.View>
        ) : null}
        {error ? (
          <Animated.View entering={FadeInDown.duration(220)} style={[styles.banner, styles.errorBanner]}>
            <AppIcon name="close" size={13} color={colors.danger} weight="bold" />
            <Text style={styles.error}>{error}</Text>
          </Animated.View>
        ) : null}
        <Section title="Session" icon="logout" delay={200}>
          <View style={styles.sectionAction}>
            <Button title={saving === "signout" ? "Signing out..." : "Sign out"} icon="logout" variant="danger" size="lg" loading={saving === "signout"} onPress={() => void runSave("signout", async () => { await signOut(); router.replace("/login" as Href); }, "Signed out.")} fullWidth />
          </View>
        </Section>
        <Button title="Delete account" icon="trash" variant="danger" style={styles.deleteButton} accessibilityLabel="Delete account" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 90 },
  page: { width: "100%", maxWidth: 1080, alignSelf: "center" },
  section: { marginHorizontal: layout.gutter, marginBottom: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5 },
  sectionAction: { padding: 16, paddingTop: 4 },
  profileRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 8 },
  profileCopy: { flex: 1, marginHorizontal: 12 },
  profileName: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sageLight, borderWidth: 2, borderColor: colors.clay },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.sageLight },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.sage },
  divider: { height: 1, marginHorizontal: 16, backgroundColor: colors.divider },
  inputLabel: { marginHorizontal: 16, marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: "800", color: colors.muted },
  fieldRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, paddingLeft: 12, paddingRight: 4, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  fieldError: { marginHorizontal: 16, marginTop: 6, color: colors.terracotta, fontSize: 11 },
  joinedRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 16, paddingTop: 12 },
  joined: { color: colors.muted, fontSize: 11 },
  helper: { paddingHorizontal: 16, paddingBottom: 10, color: colors.muted, fontSize: 12, lineHeight: 18 },
  loader: { padding: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16, paddingTop: 4 },
  selectedSummary: { paddingHorizontal: 16, paddingBottom: 10, color: colors.muted, fontSize: 11 },
  settingRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  rowCopy: { flex: 1, paddingRight: 8 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  rowValue: { marginTop: 3, fontSize: 12, color: colors.muted },
  deleteButton: { alignSelf: "center", marginBottom: 8, borderColor: "transparent", backgroundColor: "transparent" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: layout.gutter, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.md },
  successBanner: { backgroundColor: colors.sageLight },
  errorBanner: { backgroundColor: colors.dangerBg },
  message: { flex: 1, color: colors.sage, fontSize: 12, fontWeight: "700" },
  error: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: "700" },
});
