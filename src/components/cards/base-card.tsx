import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

export type BaseCardProps = ViewProps & {
	contentStyle?: StyleProp<ViewStyle>;
};

export function BaseCard({ children, contentStyle, style, ...props }: BaseCardProps) {
	return (
		<View style={[styles.card, style]} {...props}>
			<View style={[styles.content, contentStyle]}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#18352A",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 14,
		elevation: 3,
	},
	content: {
		flex: 1,
	},
});