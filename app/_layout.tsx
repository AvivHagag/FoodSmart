import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { Stack, useRouter } from "expo-router";
import "../global.css";
import AuthProvider, { useGlobalContext } from "./context/authprovider";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const { isLogged, loading, hasCompleteProfile } = useGlobalContext();

  useEffect(() => {
    if (!loading) {
      if (isLogged) {
        if (!hasCompleteProfile) {
          router.replace("/(tabs)/profile");
        } else {
          router.replace("/(tabs)/home");
        }
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isLogged, loading, hasCompleteProfile]);

  return (
    <>
      <StatusBar barStyle="default" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
