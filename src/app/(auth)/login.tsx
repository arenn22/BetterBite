import {
	KeyboardAvoidingView,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

export default function Login() {
	return (
		<View>
			<View>
				<Text>BetterBite</Text>
				<Text>Cook smarter. Waste less.</Text>
			</View>
			<KeyboardAvoidingView>
				<View>
					<TextInput placeholder="Email Address"></TextInput>
					<TextInput
						placeholder="Password"
						secureTextEntry
					></TextInput>
				</View>
			</KeyboardAvoidingView>
			<View>
				<Pressable>
					<Text>Continue with Google</Text>
				</Pressable>
				<Pressable>
					<Text>Continue with Apple</Text>
				</Pressable>
			</View>
			<View>
				<Text>or</Text>
			</View>
			<View>
				<Text>Don't have an account? Sign Up</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({});
