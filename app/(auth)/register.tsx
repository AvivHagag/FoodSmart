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
} from "react-native";
import { useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { register } = useGlobalContext();
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMessage("");
    setMessage("");
    if (password !== confirmation) {
      setErrorMessage("Passwords do not match");
      return;
    }
    try {
      const success = await register(username, password);
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
            contentContainerClassName="flex-grow justify-center px-4"
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-md mx-auto">
              <View className="items-center mb-8">
                <View className="h-16 w-16 bg-white/50 rounded-full justify-center items-center">
                  <View className="h-12 w-12 bg-gray-200 rounded-full" />
                </View>
              </View>

              <Text className="text-2xl font-bold text-center text-black mb-4">
                Register
              </Text>

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

              <View className="mb-4">
                <TextInput
                  className="h-12 bg-white border border-gray-300 rounded-md px-4"
                  placeholder="Username"
                  placeholderTextColor="#999"
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  value={username}
                />
              </View>

              <View className="mb-4">
                <TextInput
                  className="h-12 bg-white border border-gray-300 rounded-md px-4"
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  onChangeText={setPassword}
                  value={password}
                />
              </View>

              <View className="mb-4">
                <TextInput
                  className="h-12 bg-white border border-gray-300 rounded-md px-4"
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  onChangeText={setConfirmation}
                  value={confirmation}
                />
              </View>

              <TouchableOpacity
                className="h-12 bg-blue-600 rounded-md justify-center items-center"
                onPress={handleRegister}
              >
                <Text className="text-white font-semibold text-base">
                  Register
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-6"
                onPress={() => router.push("/(auth)/login")}
              >
                <Text className="text-sm text-center text-blue-600 underline">
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
