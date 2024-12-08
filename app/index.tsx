import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function App() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-lightGreen">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-5">
        <Text className="text-4xl font-bold text-hardGreen text-center mb-6">
          Animal Snap
        </Text>

        <View className="flex items-center justify-center mb-6">
          <Image
            source={require("@/assets/images/Landingimage.png")}
            className="w-64 h-64 rounded-3xl"
            resizeMode="contain"
          />
        </View>

        <Text className="text-lg text-hardGreen text-center mb-8">
          "Discover the world of wildlife through your camera!"
        </Text>

        <View className="flex items-center">
          <TouchableOpacity
            className="bg-green-700 px-8 py-4 rounded-full shadow-lg"
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text className="text-white text-lg font-bold">Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
