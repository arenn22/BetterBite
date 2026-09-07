import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login() {
	return (
		<View>
			<View>
				<Text>BetterBite</Text>
				<Text>Cook smarter. Waste less.</Text>
			</View>
			<View>
				<TextInput placeholder="Email Address" />
				<TextInput placeholder="Password" secureTextEntry />
			</View>
			<Pressable>
				<Text>Log in</Text>
			</Pressable>
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
				<Text>
					Don't have an account? {""}
					<Text>Sign up</Text>
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({});
