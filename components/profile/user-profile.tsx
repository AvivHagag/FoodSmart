import React, { Dispatch, SetStateAction } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Settings } from "lucide-react-native";
import AvatarImage from "./avatar";
import { BottomSpace } from "../bottom-space";
import ResultsPreview from "./results-preview";
import { Usertype } from "@/assets/types";
interface MenuItem {
  icon: JSX.Element;
  label: string;
  value?: string;
  onClick?: () => void;
}

interface UserProfileProps {
  user: Usertype;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setUserEditProfile: Dispatch<SetStateAction<boolean>>;
}

function calculateUsageDays(createdAt: string | undefined): number {
  if (!createdAt) {
    return 0;
  }
  const creationDate = new Date(createdAt);
  if (isNaN(creationDate.getTime())) {
    throw new Error("Invalid creation date");
  }

  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - creationDate.getTime();
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return daysDifference;
}

export default function UserProfile({
  user,
  setShowSettings,
  setUserEditProfile,
}: UserProfileProps) {
  const daysUsingApp = calculateUsageDays(user.createdAt);
  const handleMissingData = () => {
    setUserEditProfile(true);
    setShowSettings(true);
  };
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-gwhite px-4 pb-6 pt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                className="rounded-full"
                style={{ width: 60, height: 60 }}
              />
            ) : (
              <AvatarImage name={user.fullname} size={60} />
            )}
            <View className="flex-col" style={{ marginLeft: 4 }}>
              <Text className="text-lg font-semibold text-gray-900">
                {user.fullname}
              </Text>
              <Text className="text-sm text-gray-500">{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Settings size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row justify-between items-center">
          <View className="items-center flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {daysUsingApp}
            </Text>
            <Text className="text-sm text-gray-500">Days tracked</Text>
          </View>
          <View
            style={{
              width: 1,
              height: "80%",
              backgroundColor: "#9ca3af",
            }}
          />
          <View className="items-center flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {user.tdee}
            </Text>
            <Text className="text-sm text-gray-500">Calories avg.</Text>
          </View>
          <View
            style={{
              width: 1,
              height: "80%",
              backgroundColor: "#9ca3af",
            }}
          />
          <View className="items-center flex-1">
            <Text className="text-lg font-semibold text-gray-900">85%</Text>
            <Text className="text-sm text-gray-500">Goals met</Text>
          </View>
        </View>
      </View>
      <View
        className="mt-4"
        style={{
          margin: "auto",
          justifyContent: "center",
          width: "92%",
          height: 0.5,
          backgroundColor: "#9ca3af",
        }}
      />
      <View className="mt-6 space-y-2 px-4">
        <ResultsPreview
          goal={user.goal}
          bmi={user.bmi}
          tdee={user.tdee}
          handleMissingData={handleMissingData}
        />
      </View>
      <BottomSpace />
    </ScrollView>
  );
}
