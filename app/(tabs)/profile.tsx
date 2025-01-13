import { SafeAreaView, StatusBar } from "react-native";
import React, { useState } from "react";
import { useGlobalContext } from "../context/authprovider";
import ProfileScreen from "@/components/profile/profile-screen";
import EditPersonalInfoScreen from "@/components/profile/edit-personal-info";
import EditAccount from "@/components/profile/edit-account";

const Profile = () => {
  const { logout, user } = useGlobalContext();
  const [userEditProfile, setUserEditProfile] = useState<boolean>(false);
  const [accountEditProfile, setAccountEditProfile] = useState<boolean>(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {user && !userEditProfile && !accountEditProfile && (
        <ProfileScreen
          user={user}
          logout={logout}
          setUserEditProfile={setUserEditProfile}
          setAccountEditProfile={setAccountEditProfile}
        />
      )}
      {userEditProfile && user && (
        <EditPersonalInfoScreen
          user={user}
          setUserEditProfile={setUserEditProfile}
        />
      )}
      {accountEditProfile && user && (
        <EditAccount
          user={user}
          setAccountEditProfile={setAccountEditProfile}
        />
      )}
    </SafeAreaView>
  );
};

export default Profile;
