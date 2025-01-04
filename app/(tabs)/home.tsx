import { View, Text, SafeAreaView } from "react-native";
import React from "react";

const Home = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white flex-1 w-full p-4">
        <Text className="text-2xl text-center">Home</Text>
      </View>
    </SafeAreaView>
  );
};

export default Home;
