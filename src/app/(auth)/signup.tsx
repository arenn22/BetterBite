import {
	KeyboardAvoidingView,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

export default function Signup() {
	return (
		<View>
			<View>
				<Text>BetterBite</Text>
				<Text>Cook smarter. Waste less.</Text>
			</View>
			<KeyboardAvoidingView>
				<View>
					<TextInput placeholder="Email Address"></TextInput>
					<TextInput placeholder="Username"></TextInput>
					<TextInput
						placeholder="Password"
						secureTextEntry
					></TextInput>
				</View>
			</KeyboardAvoidingView>
			<View>
				<Pressable>
					<Text>Sign up with Google</Text>
				</Pressable>
				<Pressable>
					<Text>Sign up with Apple</Text>
				</Pressable>
			</View>
			<View>
				<Text>or</Text>
			</View>
			<View>
				<Text>Already have an account? Log in</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({});
