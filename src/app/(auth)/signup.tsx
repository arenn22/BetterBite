import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Signup() {
	return (
		<View>
			<View>
				<Text>BetterBite</Text>
				<Text>Cook smarter. Waste less.</Text>
			</View>
			<View>
				<TextInput placeholder="Email Address" />
				<TextInput placeholder="Username" />
				<TextInput placeholder="Password" secureTextEntry />
			</View>
			<Pressable>
				<Text>Sign Up</Text>
			</Pressable>
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
				<Text>
					Already have an account? {""}
					<Text>Log in</Text>
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({});
