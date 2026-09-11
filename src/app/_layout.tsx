import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/lib/auth/auth-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	return (
		<AuthProvider>
			<>
				<AnimatedSplashOverlay />

				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="index" />
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="(tabs)" />
				</Stack>
			</>
		</AuthProvider>
	);
}
