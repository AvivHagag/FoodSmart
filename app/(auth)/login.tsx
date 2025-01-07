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
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { login } = useGlobalContext();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setErrorMessage("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setErrorMessage("");
  };

  const handleLogin = async () => {
    if (!email) {
      setErrorMessage("Please enter Email");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter Password");
      return;
    }
    setIsLoading(true);
    try {
      const { success, error } = await login(email, password);
      if (!success) {
        setErrorMessage(error || "Invalid credentials. Try again.");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerClassName="flex-grow items-center mt-32 px-4"
            keyboardShouldPersistTaps="handled"
            className="flex-1"
          >
            <View className="w-full max-w-md mx-auto">
              <View className="items-center mb-8">
                <Image
                  source={require("@/assets/images/Logo1.png")}
                  className="w-64 h-24"
                  resizeMode="contain"
                />
              </View>

              <View className="space-y-2 text-center mb-8">
                <Text className="text-2xl font-semibold text-black">
                  Sign in to your account
                </Text>
                <Text className="text-sm text-gray-700">
                  Enter your email and password to access your account
                </Text>
              </View>

              <View className="bg-white/90 p-6 rounded-lg shadow-md">
                {errorMessage ? (
                  <Text className="text-red-500 text-center mb-4">
                    {errorMessage}
                  </Text>
                ) : null}

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email
                  </Text>
                  <TextInput
                    className="h-12 bg-gray-100 border border-gray-300 rounded-md px-4"
                    placeholder="m@example.com"
                    placeholderTextColor="#999"
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    value={email}
                    keyboardType="email-address"
                  />
                </View>

                <View className="mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Password
                    </Text>
                    <TouchableOpacity onPress={() => alert("Reset password")}>
                      <Text className="text-sm text-blue-600">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="h-12 bg-gray-100 border border-gray-300 rounded-md px-4"
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    onChangeText={handlePasswordChange}
                    value={password}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={
                    isLoading
                      ? styles.buttonContainerClicked
                      : styles.buttonContainer
                  }
                >
                  <LinearGradient
                    colors={["#0EA5E9", "#000000"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Log in
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-6 text-center">
                <Text className="text-center text-sm text-gray-700">
                  Don&apos;t have an account?{" "}
                  <Text
                    className="text-blue-600 underline"
                    onPress={() => router.push("/(auth)/register")}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainerClicked: {
    opacity: 0.5,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
