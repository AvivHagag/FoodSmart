import { SafeAreaView, StatusBar } from "react-native";
import React from "react";
import { useGlobalContext } from "../context/authprovider";
import ProfileScreen from "@/components/profile/profile-screen";

const Profile = () => {
  const { logout, user } = useGlobalContext();
  return (
    <SafeAreaView className="flex-1 bg-white">
      {user && <ProfileScreen user={user} logout={logout} />}
    </SafeAreaView>
  );
};

export default Profile;
