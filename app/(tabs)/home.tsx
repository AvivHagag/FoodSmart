import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useGlobalContext } from "../context/authprovider";

const Home = () => {
  const { logout } = useGlobalContext();
  return (
    <View className="bg-white flex-1 w-full">
      <Text>Home</Text>
      <TouchableOpacity
        className="flex justify-center mx-auto my-12 w-1/2 bg-red-500 rounded-lg p-2"
        onPress={() => logout()}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
