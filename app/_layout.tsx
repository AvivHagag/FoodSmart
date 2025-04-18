import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { Stack, useRouter } from "expo-router";
import "../global.css";
import { useColorScheme } from "@/hooks/useColorScheme";
import AuthProvider, { useGlobalContext } from "./context/authprovider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { isLogged, loading } = useGlobalContext();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    if (!loading && !isLogged) {
      router.replace("/(auth)/login");
    }
  }, [isLogged, loading, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <AuthProvider>
        <Stack>
          <StatusBar barStyle="default" />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* <Stack.Screen name="profile" options={{ title: "Profile Page" }} /> */}
        </Stack>
      </AuthProvider>
    </>
  );
}
