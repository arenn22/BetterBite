import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/app-theme";

export type SectionHeadingProps = {
	title: string;
	subtitle: string;
	rightContent?: ReactNode;
};

export function SectionHeading({
	title,
	subtitle,
	rightContent,
}: SectionHeadingProps) {
	return (
		<View style={styles.container}>
			<View>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{subtitle}</Text>
			</View>
			{rightContent}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
	},
	title: {
		color: AppTheme.text,
		fontSize: 22,
		fontWeight: "600",
	},
	subtitle: {
		color: AppTheme.muted,
		fontSize: 12,
		marginTop: 4,
	},
});
