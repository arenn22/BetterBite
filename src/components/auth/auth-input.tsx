import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, radii } from "@/app/(tabs)/theme";
import { AppIcon, type IconName } from "@/components/ui/icon";

export default function AuthInput({ icon, onFocus, onBlur, ...props }: TextInputProps & { icon?: IconName }) {
	const [focused, setFocused] = useState(false);

	return (
		<View style={[styles.field, focused && styles.fieldFocused]}>
			{icon ? <AppIcon name={icon} size={17} color={focused ? colors.sage : colors.faint} /> : null}
			<TextInput
				{...props}
				onFocus={(event) => {
					setFocused(true);
					onFocus?.(event);
				}}
				onBlur={(event) => {
					setFocused(false);
					onBlur?.(event);
				}}
				style={styles.input}
				placeholderTextColor={colors.faint}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	field: {
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 15,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radii.md,
		backgroundColor: colors.bg,
	},

	fieldFocused: {
		borderColor: colors.sage,
		backgroundColor: colors.card,
		shadowColor: colors.sage,
		shadowOpacity: 0.2,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 0 },
	},

	input: {
		flex: 1,
		height: "100%",
		fontSize: 16,
		color: colors.ink,
	},
});
