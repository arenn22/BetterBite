import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [currentUser, setCurrentUser] = useState<boolean>(false);

  const segments = useSegments();
  const inAuth = segments[0] === 'auth';

  if (!currentUser && !inAuth) {
    return <Redirect href="/auth/login" />;
  }

  if (currentUser && inAuth) {
    return <Redirect href="/tabs/home" />;
  }

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
      </Stack>
    </ThemeProvider>
  );
}
