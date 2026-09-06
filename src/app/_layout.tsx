import {
  DarkTheme,
  DefaultTheme,
  Redirect,
  Stack,
  ThemeProvider,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/lib/auth/auth-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [currentUser] = useState<boolean>(false);

	const segments = useSegments();
	const inAuth = segments[0] === "auth";

	if (!currentUser && !inAuth) {
		return <Redirect href="/auth/login" />;
	}

	if (currentUser && inAuth) {
		return <Redirect href="/tabs/home" />;
	}

	const colorScheme = useColorScheme();

	return (
		<AuthProvider>
			<ThemeProvider
				value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
			>
				<AnimatedSplashOverlay />
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="auth" />
					<Stack.Screen name="tabs" />
				</Stack>
			</ThemeProvider>
		</AuthProvider>
	);
}
