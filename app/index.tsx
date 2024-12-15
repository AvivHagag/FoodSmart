import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
export default function App() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-5">
        <Text className="text-4xl font-bold text-hardGreen text-center mb-6">
          FoodSmart
        </Text>

        <View className="flex items-center justify-center mb-6">
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-90 h-64"
            resizeMode="contain"
          />
        </View>

        <Text className="text-lg text-hardGreen text-center mb-8">
          “Discover the nutrition behind your food in a snap!”
        </Text>

        <View className="flex items-center">
          <LinearGradient
            colors={["#A2D38C", "#4E8F54"]}
            style={{ borderRadius: 12, marginTop: 16 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              className="items-center py-4 px-8 rounded-lg shadow-lg"
            >
              <Text className="text-white text-lg font-bold">Get Started</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
