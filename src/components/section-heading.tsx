import { StyleSheet, Text, View, type ReactNode } from "react-native";

export type SectionHeadingProps = {
	title: string;
	subtitle: string;
	rightContent?: ReactNode;
};

export function SectionHeading({ title, subtitle, rightContent }: SectionHeadingProps) {
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
		color: "#25372B",
		fontSize: 22,
		fontWeight: "800",
	},
	subtitle: {
		color: "#829087",
		fontSize: 12,
		marginTop: 4,
	},
});