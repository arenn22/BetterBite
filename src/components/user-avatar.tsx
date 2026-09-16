import { StyleSheet, Text, View } from "react-native";

export type UserAvatarProps = {
	initial: string;
	tone?: "peach" | "green";
};

export function UserAvatar({ initial, tone = "peach" }: UserAvatarProps) {
	return (
		<View style={[styles.avatar, tone === "green" && styles.greenAvatar]}>
			<Text style={[styles.initial, tone === "green" && styles.greenInitial]}>{initial}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#F5DFD2",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 3,
		borderColor: "#FFF8F3",
	},
	initial: {
		color: "#B45E42",
		fontSize: 17,
		fontWeight: "800",
	},
	greenAvatar: {
		backgroundColor: "#DDE8D8",
		borderColor: "#F2F6EE",
	},
	greenInitial: {
		color: "#55735A",
	},
});