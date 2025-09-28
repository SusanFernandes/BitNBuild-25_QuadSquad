import '~/global.css';
import { PortalHost } from '@rn-primitives/portal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SplashScreen, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { HardHatIcon } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '~/lib/contexts/UserContext';

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.light,
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, isLoading, isOnboarded } = useUser();

  React.useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const isSignedIn = !!user;
    
    if (isSignedIn && inAuthGroup) {
      // Check if user needs onboarding
      if (!isOnboarded) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(drawer)/(tabs)/' as any);
      }
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/');
    } else if (isSignedIn && isOnboarded && inOnboardingGroup) {
      router.replace('/(drawer)/(tabs)/' as any);
    }
  }, [segments, navigationState?.key, user, isLoading, isOnboarded]);

  return (
    <Stack
      screenOptions={{
        animation: 'ios',
        animationTypeForReplace: 'push',
        headerShadowVisible: false,
        headerTransparent: true,
      }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="form" options={{ title: 'Onboarding' }} />
    </Stack>
  );
};

export default function RootLayout() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem('theme');
      if (Platform.OS === 'web') {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add('bg-background');
      }
      if (!theme) {
        AsyncStorage.setItem('theme', colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === 'dark' ? 'dark' : 'light';
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
          <GestureHandlerRootView>
            <InitialLayout />
          </GestureHandlerRootView>
        </ThemeProvider>
        <PortalHost />
      </UserProvider>
    </QueryClientProvider>
  );
}
