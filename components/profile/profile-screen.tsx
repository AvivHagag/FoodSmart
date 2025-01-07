import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Settings, ChevronRight, LogOut, Bell } from "lucide-react-native";
import AvatarImage from "./avatar";

interface MenuItem {
  icon: JSX.Element;
  label: string;
  value?: string;
  onClick?: () => void;
}

interface Usertype {
  _id: string;
  email: string;
  fullname: string;
  createdAt?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  image?: string | null;
  gender?: string | null;
}

interface ProfileScreenProps {
  user: Usertype;
  logout: () => Promise<void>;
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

export default function ProfileScreen({ user, logout }: ProfileScreenProps) {
  const daysUsingApp = calculateUsageDays(user.createdAt);

  const menuItems: MenuItem[] = [
    {
      icon: <Settings color={"#3b82f6"} />,
      label: "Settings",
      onClick: () => console.log("Settings clicked"),
    },
    {
      icon: <Bell color={"#3b82f6"} />,
      label: "Notifications",
      value: "3 new",
    },
    {
      icon: <LogOut color={"#ef4444"} />,
      label: "Log out",
      onClick: () => logout(),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pb-6 pt-12">
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

        <View className="mt-6 flex-row justify-between items-center">
          <View className="items-center flex-1">
            <Text className="text-2xl font-semibold text-gray-900">
              {daysUsingApp}
            </Text>
            <Text className="text-xs text-gray-500">Days tracked</Text>
          </View>
          <View
            style={{
              width: 1,
              height: "80%",
              backgroundColor: "#9ca3af",
            }}
          />
          <View className="items-center flex-1">
            <Text className="text-2xl font-semibold text-gray-900">1,854</Text>
            <Text className="text-xs text-gray-500">Calories avg.</Text>
          </View>
          <View
            style={{
              width: 1,
              height: "80%",
              backgroundColor: "#9ca3af",
            }}
          />
          <View className="items-center flex-1">
            <Text className="text-2xl font-semibold text-gray-900">85%</Text>
            <Text className="text-xs text-gray-500">Goals met</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 space-y-2 px-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onClick}
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
          >
            <View className="flex-row items-center gap-3">
              {item.icon}
              <Text
                className={`font-medium ${
                  item.label === "Log out" ? "text-red-500" : "text-gray-700"
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
                color={`${item.label === "Log out" ? "#ef4444" : "#3b82f6"}`}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
