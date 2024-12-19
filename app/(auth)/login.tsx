import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
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
      await AsyncStorage.setItem("token", data.token);
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
        resizeMode="cover"
      />
      <View className="mt-24">
        <Text className="text-6xl font-bold text-black text-center mb-2">
          Login
        </Text>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-4"
            keyboardShouldPersistTaps="handled"
            className="flex-1"
          >
            <View className="w-full max-w-md mx-auto">
              <BlurView
                intensity={60}
                tint="light"
                className="p-6 bg-white/40 rounded-lg border border-gray-800"
              >
                <Text className="text-xl font-semibold text-black text-center mb-8">
                  Enter your login information
                </Text>
                {errorMessage ? (
                  <Text className="text-red-500 mb-4 text-center">
                    {errorMessage}
                  </Text>
                ) : null}

                <View className="mb-4">
                  <TextInput
                    className="border border-gray-700 rounded-lg px-4 py-3 text-black bg-white/80"
                    placeholder="Email"
                    placeholderTextColor="#999"
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    value={email}
                    keyboardType="email-address"
                  />
                </View>

                <View className="mb-4 relative">
                  <TextInput
                    className="border border-gray-700 rounded-lg px-4 py-3 text-black bg-white/80"
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                  />
                  <TouchableOpacity className="absolute right-4 top-3">
                    <Text className="text-gray-800 text-sm underline">
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="border border-black rounded-lg py-3 mt-4 items-center bg-white/60"
                  onPress={handleLogin}
                >
                  <Text className="text-black text-base font-bold">Log in</Text>
                </TouchableOpacity>

                <View className="items-center mt-6">
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
                  >
                    <Text className="text-gray-800 underline text-base">
                      New here? Join now
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
