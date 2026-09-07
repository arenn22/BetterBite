import { StyleSheet, TextInput, TextInputProps } from "react-native";

export default function AuthInput(props: TextInputProps) {
	return (
		<TextInput
			{...props}
			style={styles.input}
			placeholderTextColor="#888"
		/>
	);
}

const styles = StyleSheet.create({
	input: {
		height: 52,

		borderWidth: 1,
		borderColor: "#D4D5CE",
		borderRadius: 9,

		paddingHorizontal: 15,

		backgroundColor: "#F7F7F4",

		fontSize: 16,
		color: "#30312E",

		marginBottom: 12,
	},
});
