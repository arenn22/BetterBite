import { Pressable, StyleSheet, Text } from "react-native";

interface AuthButtonProps {
	title: string;
	onPress?: () => void;
	disabled?: boolean;
}

export default function AuthButton({
	title,
	onPress,
	disabled,
}: AuthButtonProps) {
	return (
		<Pressable style={styles.button} onPress={onPress} disabled={disabled}>
			<Text style={styles.text}>{title}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 52,
		borderRadius: 26,

		alignItems: "center",
		justifyContent: "center",

		backgroundColor: "#687B5D",
	},

	text: {
		color: "#FFFFFF",
		fontSize: 17,
		fontWeight: "500",
	},
});
