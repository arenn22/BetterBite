import { Stack } from "expo-router";
import { KeyboardAvoidingView } from "react-native";

export default function AuthLayout() {
	return (
		<KeyboardAvoidingView>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="login" />
				<Stack.Screen name="signup" />
			</Stack>
		</KeyboardAvoidingView>
	);
}
