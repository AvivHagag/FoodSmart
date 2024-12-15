import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { BASE_URL } from "@/constants/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login. Please try again.");
      }

      // Store the token
      await AsyncStorage.setItem("token", data.token);

      // Navigate to Home
      router.push("/home");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <View className="flex-1 relative">
      <Image
        source={require("@/assets/images/wall5.jpg")}
        className="absolute inset-0 w-full h-full"
        resizeMode="center"
      />
      <View className="mt-24">
        <Text className="text-6xl font-bold text-black text-center mb-2">
          Login
        </Text>
      </View>
      <View className="flex-1 justify-end">
        <BlurView
          intensity={60}
          tint="light"
          className="w-full p-5 bg-white/40 h-3/5 border-t border-gray-800"
        >
          {errorMessage ? (
            <Text className="text-red-500 mb-2 text-center">
              {errorMessage}
            </Text>
          ) : null}
          <View className="w-full my-4 relative">
            <Text className="text-xl font-semibold text-black text-center mb-8">
              Enter your login information
            </Text>
            <TextInput
              className="border border-gray-700 rounded-lg px-4 py-3 text-black bg-white/80"
              placeholder="Email"
              placeholderTextColor="#999"
              onChangeText={setEmail}
              autoCapitalize="none"
              value={email}
            />
          </View>
          <View className="w-full mb-4 relative">
            <TextInput
              className="border border-gray-700 rounded-lg px-4 py-3 text-black bg-white/80"
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity className="absolute right-0 bottom-[-20px]">
              <Text className="text-gray-800 text-sm underline">
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="border border-black rounded-lg py-3 mt-16 items-center w-full bg-white/60"
            onPress={handleLogin}
          >
            <Text className="text-black text-base font-bold">Log in</Text>
          </TouchableOpacity>
          <View className="items-center mt-6">
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-gray-800 underline text-base">
                New here? Join now
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
