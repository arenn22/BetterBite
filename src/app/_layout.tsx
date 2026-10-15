import { loadAsync } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import materialSymbols from "expo-symbols/androidWeights/regular";
import { Platform } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuthContext } from "@/lib/auth/auth-context";
import {
	subscribeToFriendPostNotifications,
	syncStreakReminder,
} from "@/services/notifications";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	// Android and web draw icons with the Material Symbols font; start loading it
	// as soon as the app mounts so icons are ready by the first screen.
	useEffect(() => {
		if (Platform.OS !== "ios") {
			void loadAsync({ [materialSymbols.name]: materialSymbols.font }).catch(() => {});
		}
	}, []);

	return (
		<AuthProvider>
			<>
				<NotificationLifecycle />
				<AnimatedSplashOverlay />

				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="index" />
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="(tabs)" />
					<Stack.Screen name="settings" />
				</Stack>
			</>
		</AuthProvider>
	);
}

function NotificationLifecycle() {
	const { currentUser } = useAuthContext();

	useEffect(() => {
		void syncStreakReminder(currentUser).catch((error) => {
			console.error("Unable to schedule streak reminder:", error);
		});

		let unsubscribe: (() => void) | undefined;
		let cancelled = false;
		void subscribeToFriendPostNotifications(currentUser)
			.then((cleanup) => {
				if (cancelled) cleanup();
				else unsubscribe = cleanup;
			})
			.catch((error) => {
				console.error("Unable to subscribe to friend notifications:", error);
			});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [currentUser]);

	return null;
}
