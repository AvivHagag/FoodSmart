import { SafeAreaView, ScrollView, RefreshControl } from "react-native";
import React, { useState } from "react";
import { useGlobalContext } from "../context/authprovider";
import EditPersonalInfoScreen from "@/components/profile/edit-personal-info";
import EditAccount from "@/components/profile/edit-account";
import UserSetting from "@/components/profile/user-setting";
import UserProfile from "@/components/profile/user-profile";

const Profile = () => {
  const { logout, user, updateUser } = useGlobalContext();
  const [userEditProfile, setUserEditProfile] = useState(false);
  const [accountEditProfile, setAccountEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Add your refresh logic here
      // For example, refetch user data
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
            title="Pull to refresh"
            titleColor="#f97316"
          />
        }
      >
        {!userEditProfile && !accountEditProfile && !showSettings && (
          <UserProfile
            user={user}
            setShowSettings={setShowSettings}
            setUserEditProfile={setUserEditProfile}
          />
        )}
        {showSettings && !userEditProfile && !accountEditProfile && (
          <UserSetting
            user={user}
            logout={logout}
            setUserEditProfile={setUserEditProfile}
            setAccountEditProfile={setAccountEditProfile}
            setShowSettings={setShowSettings}
          />
        )}
        {userEditProfile && (
          <EditPersonalInfoScreen
            user={user}
            setUserEditProfile={setUserEditProfile}
            updateUser={updateUser}
          />
        )}

        {accountEditProfile && (
          <EditAccount
            user={user}
            setAccountEditProfile={setAccountEditProfile}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
