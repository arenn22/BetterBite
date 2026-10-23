import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { colors, fonts, radii } from "@/app/(tabs)/theme";

export default function AuthHeader() {
	return (
		<View style={styles.container}>
			<Animated.View entering={ZoomIn.springify().damping(14)} style={styles.mark}>
				<Image
					source={require("@/assets/images/betterbite-icon.svg")}
					style={styles.markImage}
					contentFit="contain"
				/>
			</Animated.View>
			<Animated.View entering={FadeInDown.delay(120).duration(380)} style={styles.copy}>
				<Text style={styles.title}>BetterByte</Text>
				<Text style={styles.subtitle}>Cook smarter. Waste less.</Text>
			</Animated.View>
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginBottom: 30,
	},

	mark: {
		width: 56,
		height: 56,
		marginBottom: 14,
		borderRadius: radii.lg,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: colors.sage,
		shadowOpacity: 0.35,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 5 },
		elevation: 5,
	},

	markImage: {
		width: "100%",
		height: "100%",
		borderRadius: radii.lg,
	},

	copy: {
		alignItems: "center",
	},

	title: {
		fontFamily: fonts.heading,
		fontSize: 30,
		color: colors.ink,
	},

	subtitle: {
		marginTop: 8,
		fontSize: 15,
		color: colors.muted,
	},
});
