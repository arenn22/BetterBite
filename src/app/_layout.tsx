import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuthContext } from "@/lib/auth/auth-context";
import {
	subscribeToFriendPostNotifications,
	syncStreakReminder,
} from "@/services/notifications";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	return (
		<AuthProvider>
			<>
				<NotificationLifecycle />
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

function NotificationLifecycle() {
	const { currentUser } = useAuthContext();

	useEffect(() => {
		void syncStreakReminder(currentUser).catch((error) => {
			console.error("Unable to schedule streak reminder:", error);
		});

		let unsubscribe: (() => void) | undefined;
		void subscribeToFriendPostNotifications(currentUser)
			.then((cleanup) => {
				unsubscribe = cleanup;
			})
			.catch((error) => {
				console.error("Unable to subscribe to friend notifications:", error);
			});

		return () => unsubscribe?.();
	}, [currentUser]);

	return null;
}
