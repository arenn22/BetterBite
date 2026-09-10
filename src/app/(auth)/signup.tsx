import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useAuthContext } from "@/lib/auth/auth-context";

export default function Signup() {
	const router = useRouter();
	const [usernameInput, setUsernameInput] = useState("");
	const [emailInput, setEmailInput] = useState("");
	const [passwordInput, setPasswordInput] = useState("");
	const { error, loading, signup } = useAuthContext();

	const onSignUp = async () => {
		const success = await signup(usernameInput, emailInput, passwordInput);

		if (success) {
			router.replace("/(tabs)/home");
		}
	};

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
						<AuthInput
							placeholder="Username"
							value={usernameInput}
							onChangeText={setUsernameInput}
						/>

						<AuthInput
							placeholder="Email Address"
							value={emailInput}
							onChangeText={setEmailInput}
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
						/>

						<AuthInput
							placeholder="Password"
							secureTextEntry
							value={passwordInput}
							onChangeText={setPasswordInput}
							autoCapitalize="none"
							autoCorrect={false}
						/>

						<View style={styles.authButton}>
							<AuthButton
								title={loading ? "Signing Up..." : "Sign Up"}
								onPress={onSignUp}
								disabled={loading}
							/>
						</View>

						{error ? <Text style={styles.errorText}>{error}</Text> : null}
					</View>

					<View style={styles.bottomLink}>
						<Text style={styles.bottomText}>
							Already have an account?{" "}
						</Text>

						<Pressable>
							<Text style={styles.bottomLinkText}>Log In</Text>
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

	authButton: {
		marginTop: 16,
		marginBottom: 20,
	},

	errorText: {
		color: "#B42318",
		fontSize: 14,
		textAlign: "center",
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
