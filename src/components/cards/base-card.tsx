import {
	StyleSheet,
	View,
	type StyleProp,
	type ViewProps,
	type ViewStyle,
} from "react-native";

import { AppTheme } from "@/constants/app-theme";

export type BaseCardProps = ViewProps & {
	contentStyle?: StyleProp<ViewStyle>;
};

export function BaseCard({
	children,
	contentStyle,
	style,
	...props
}: BaseCardProps) {
	return (
		<View style={[styles.card, style]} {...props}>
			<View style={[styles.content, contentStyle]}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: AppTheme.card,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: AppTheme.border,
		overflow: "hidden",
		shadowColor: "#30312E",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 1,
	},
	content: {
		flex: 1,
	},
});
