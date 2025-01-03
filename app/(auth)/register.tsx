import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { register } = useGlobalContext();
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMessage("");
    setMessage("");
    try {
      const success = await register(username, email, password);
      if (success) {
        console.log("Registration successful! You can log in now.");
        router.replace("/(auth)/login");
      } else {
        setErrorMessage("Registration failed or user already exists");
      }
    } catch (err: unknown) {
      setErrorMessage("Network error. Please try again.");
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
                  Create your account
                </Text>
                <Text className="text-sm text-gray-700">
                  Enter your details to sign up for an account
                </Text>
              </View>

              <View className="bg-white/90 p-6 rounded-lg shadow-md">
                {message ? (
                  <Text className="text-green-500 text-center mb-4">
                    {message}
                  </Text>
                ) : null}
                {errorMessage ? (
                  <Text className="text-red-500 text-center mb-4">
                    {errorMessage}
                  </Text>
                ) : null}

                {/* Username */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Username
                  </Text>
                  <TextInput
                    className="h-12 bg-gray-100 border border-gray-300 rounded-md px-4"
                    placeholder="Enter your username"
                    placeholderTextColor="#999"
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    value={username}
                  />
                </View>

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email
                  </Text>
                  <TextInput
                    className="h-12 bg-gray-100 border border-gray-300 rounded-md px-4"
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                  />
                </View>

                {/* Password */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Text>
                  <TextInput
                    className="h-12 bg-gray-100 border border-gray-300 rounded-md px-4"
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                  />
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={styles.buttonContainer}
                  className={isLoading ? "opacity-50" : ""}
                >
                  <LinearGradient
                    colors={["#3B82F6", "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Register
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-6 text-center">
                <Text className="text-center text-sm text-gray-700">
                  Already have an account?{" "}
                  <Text
                    className="text-blue-600 underline"
                    onPress={() => router.push("/(auth)/login")}
                  >
                    Log in
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  buttonContainer: {
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
