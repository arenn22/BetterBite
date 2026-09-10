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
import { handleSignUp } from "@/services/api";

export default function Signup() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const onSignUp = async () => {
		const result = await handleSignUp(username, email, password);

		if (result.error) {
			console.error(result.error);
			return;
		}

		console.log("Signed up successfully", result.profile);
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
							value={username}
							onChangeText={setUsername}
						/>

						<AuthInput
							placeholder="Email Address"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
						/>

						<AuthInput
							placeholder="Password"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
							autoCapitalize="none"
							autoCorrect={false}
						/>

						<View style={styles.authButton}>
							<AuthButton title="Sign Up" onPress={onSignUp} />
						</View>
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
