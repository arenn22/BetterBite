import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import AuthButton from "@/components/auth/auth-button";
import AuthHeader from "@/components/auth/auth-header";
import AuthInput from "@/components/auth/auth-input";

export default function Login() {
	return (
		<KeyboardAvoidingView
			style={styles.keyboard}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.content}>
					<AuthHeader />

					<View style={styles.form}>
						<AuthInput placeholder="Username" />

						<AuthInput placeholder="Password" secureTextEntry />

						<Pressable style={styles.forgotPassword}>
							<Text style={styles.forgotPasswordText}>
								Forgot password?
							</Text>
						</Pressable>

						<View style={styles.authButton}>
							<AuthButton title="Log In" />
						</View>
					</View>

					<View style={styles.bottomLink}>
						<Text style={styles.bottomText}>
							Don't have an account?{" "}
						</Text>

						<Pressable>
							<Text style={styles.bottomLinkText}>Sign Up</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	keyboard: {
		flex: 1,
	},

	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingVertical: 40,
	},

	content: {
		width: "100%",
		maxWidth: 400,
		alignSelf: "center",
		paddingHorizontal: 24,
	},

	form: {
		marginTop: 5,
	},

	forgotPassword: {
		alignSelf: "flex-end",
		marginTop: 2,
		marginBottom: 32,
	},

	forgotPasswordText: {
		fontSize: 14,
		color: "#687B5D",
	},

	authButton: {
		marginBottom: 20,
	},

	bottomLink: {
		marginTop: 40,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap",
	},

	bottomText: {
		fontSize: 14,
		color: "#85877D",
	},

	bottomLinkText: {
		color: "#687B5D",
		fontWeight: "600",
	},
});
