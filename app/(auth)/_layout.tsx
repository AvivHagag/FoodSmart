import { Stack, useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";
import { useEffect } from "react";

export default function Layout() {
  const router = useRouter();
  const { isLogged } = useGlobalContext();

  useEffect(() => {
    if (isLogged) {
      router.replace("/(tabs)/home");
    }
  }, [isLogged]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
