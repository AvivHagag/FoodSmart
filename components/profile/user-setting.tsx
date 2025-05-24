import React, { Dispatch, SetStateAction } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import {
  Settings,
  ChevronRight,
  LogOut,
  Headset,
  UserRoundPen,
  MessageCircle,
} from "lucide-react-native";
import AvatarImage from "./avatar";
import { BottomSpace } from "../bottom-space";
import Title from "../title";
import { Usertype } from "@/assets/types";

interface MenuItem {
  icon: JSX.Element;
  label: string;
  value?: string;
  onClick?: () => void;
}

interface UserSettingProps {
  user: Usertype;
  logout: () => Promise<void>;
  setUserEditProfile: Dispatch<SetStateAction<boolean>>;
  setAccountEditProfile: Dispatch<SetStateAction<boolean>>;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setShowContactSupport: Dispatch<SetStateAction<boolean>>;
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

export default function UserSetting({
  user,
  logout,
  setUserEditProfile,
  setAccountEditProfile,
  setShowSettings,
  setShowContactSupport,
}: UserSettingProps) {
  const daysUsingApp = calculateUsageDays(user.createdAt);
  const menuItems: MenuItem[] = [
    {
      icon: <UserRoundPen color={"#3b82f6"} />,
      label: "Edit Personal Info",
      onClick: () => setUserEditProfile(true),
    },
    {
      icon: <Settings color={"#3b82f6"} />,
      label: "Account",
      onClick: () => setAccountEditProfile(true),
    },
    {
      icon: <Headset color={"#6b7280"} />,
      label: "Contact Support",
      onClick: () => setShowContactSupport(true),
    },
    {
      icon: <MessageCircle color={"#6b7280"} />,
      label: "Get Help",
    },
    {
      icon: <LogOut color={"#ef4444"} />,
      label: "Log out",
      onClick: () => logout(),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-gwhite px-4 pb-6 pt-12">
        <Title text="Settings" backBottom={() => setShowSettings(false)} />
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
      <View className="mt-4 space-y-2 px-4">
        {menuItems.map((item, index) => (
          <View key={index}>
            {item.label !== "Log out" ? (
              <TouchableOpacity
                onPress={item.onClick}
                className="flex-row items-center justify-between rounded-xl p-4"
              >
                <View className="flex-row items-center gap-3">
                  {item.icon}
                  <Text
                    className={`font-medium ${
                      item.label === "Log out"
                        ? "text-red-500"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {item.value && (
                    <Text className="text-sm text-gray-500">{item.value}</Text>
                  )}
                  <ChevronRight
                    className="text-gray-400"
                    color={`${item.icon.props.color}`}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={item.onClick}
                className="mx-auto flex-row items-center justify-between rounded-xl mt-4 p-4 border"
                style={{
                  borderColor: "#f87171",
                  width: "90%",
                }}
              >
                <View className="flex-row items-center mx-auto">
                  {item.icon}
                  <Text
                    className={`font-medium ml-1 ${
                      item.label === "Log out"
                        ? "text-red-500"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
      <BottomSpace />
    </ScrollView>
  );
}
