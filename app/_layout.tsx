import { ImagePreviewProvider } from "@/context/ImagePreviewContext";
import { initDB } from "@/services/db";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    initDB()
      .then(() => {
        setDbReady(true);
      })
      .catch((e) => {
        console.error("DB init failed:", e);
        setDbReady(true); // Proceed anyway or show error
      });
  }, []);

  useEffect(() => {
    if (dbReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [dbReady, fontsLoaded]);

  if (!dbReady || !fontsLoaded) {
    return null;
  }

  return (
    <ImagePreviewProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ImagePreviewProvider>
  );
}
