import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/app-theme";

export type TabHeaderProps = {
	eyebrow: string;
	title: string;
	subtitle: string;
	initial?: string;
};

export function TabHeader({
	eyebrow,
	title,
	subtitle,
	initial,
}: TabHeaderProps) {
	return (
		<View style={styles.container}>
			<View style={styles.copy}>
				<Text style={styles.eyebrow}>{eyebrow}</Text>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{subtitle}</Text>
			</View>
			{initial ? (
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>{initial}</Text>
				</View>
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
