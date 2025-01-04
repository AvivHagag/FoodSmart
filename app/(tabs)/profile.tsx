import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import React from "react";
import { useGlobalContext } from "../context/authprovider";

const Profile = () => {
  const { logout, user } = useGlobalContext();
  console.log(user);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white flex-1 w-full p-4">
        <Text className="text-2xl text-center">
          Hello {user ? user.username : ""}
        </Text>
        <TouchableOpacity
          className="flex justify-center mx-auto my-12 w-1/2 bg-red-500 rounded-lg p-2"
          onPress={() => logout()}
        >
          <Text style={{ color: "white", textAlign: "center" }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
