import { Slot } from "expo-router";
import { ImageBackground, StyleSheet, useWindowDimensions } from "react-native";

export default function AuthLayout() {
	const { width } = useWindowDimensions();

	const background =
		width >= 768
			? require("@/assets/images/auth-bg-wide.jpg")
			: require("@/assets/images/auth-bg-phone.png");

	return (
		<ImageBackground
			source={background}
			style={styles.background}
			resizeMode="cover"
		>
			<Slot />
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: "100%",
		height: "100%",
		minHeight: "100vh" as any, // web only, ignored on native
	},
});
