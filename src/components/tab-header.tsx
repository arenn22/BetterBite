import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/app-theme";
import { useAuthContext } from "@/lib/auth/auth-context";

export type TabHeaderProps = {
	eyebrow: string;
	title: string;
	subtitle: string;
	initial?: string;
	onSettingsPress?: () => void;
};

export function TabHeader({
	eyebrow,
	title,
	subtitle,
	initial,
	onSettingsPress,
}: TabHeaderProps) {
	const { currentUser } = useAuthContext();
	const [imageFailed, setImageFailed] = useState(false);
	const profilePictureUrl = currentUser?.pfp_url?.trim();
	const showProfilePicture = Boolean(profilePictureUrl) && !imageFailed;

	return (
		<View style={styles.container}>
			{onSettingsPress ? (
				<Pressable
					accessibilityLabel="Open settings"
					onPress={onSettingsPress}
					style={({ pressed }) => [
						styles.settingsButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.settingsIcon}>...</Text>
				</Pressable>
			) : null}
			<View style={styles.copy}>
				<Text style={styles.eyebrow}>{eyebrow}</Text>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{subtitle}</Text>
			</View>
			{initial ? (
				showProfilePicture ? (
					<Image
						accessibilityLabel="Your profile picture"
						source={{ uri: profilePictureUrl }}
						style={styles.avatar}
						onError={() => setImageFailed(true)}
					/>
				) : (
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>{initial}</Text>
					</View>
				)
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 14,
		paddingBottom: 24,
	},
	copy: { flex: 1, paddingRight: 16 },
	settingsButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: AppTheme.surface,
		borderWidth: 1,
		borderColor: AppTheme.border,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	settingsIcon: {
		color: AppTheme.accent,
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
	},
	pressed: { opacity: 0.65 },
	eyebrow: {
		color: AppTheme.muted,
		fontSize: 13,
		fontWeight: "500",
		letterSpacing: 0,
	},
	title: {
		color: AppTheme.text,
		fontSize: 32,
		fontWeight: "600",
		marginTop: 6,
	},
	subtitle: {
		color: AppTheme.muted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 5,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: AppTheme.warmSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { color: AppTheme.warm, fontSize: 16, fontWeight: "600" },
});
