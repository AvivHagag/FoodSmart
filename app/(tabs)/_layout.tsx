import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";
import { View, Text, ColorValue } from "react-native";
import { Tabs } from "expo-router";
import {
  Home,
  History,
  ChartNoAxesCombined,
  User,
  Camera,
} from "lucide-react-native";

type IconComponent = React.FC<{
  size?: string | number;
  color?: ColorValue | string;
}>;

type Tab = {
  name: string;
  title: string;
  OutlineIcon: IconComponent;
};

const tabs: Tab[] = [
  {
    name: "home",
    title: "Home",
    OutlineIcon: Home,
  },
  {
    name: "statistics",
    title: "Statistics",
    OutlineIcon: ChartNoAxesCombined,
  },
  {
    name: "camera",
    title: "Camera",
    OutlineIcon: Camera,
  },
  {
    name: "history",
    title: "History",
    OutlineIcon: History,
  },
  {
    name: "profile",
    title: "Profile",
    OutlineIcon: User,
  },
];

const TabsLayout: React.FC = () => {
  const router = useRouter();
  const { isLogged, loading } = useGlobalContext();

  useEffect(() => {
    if (!loading && !isLogged) {
      router.replace("/(auth)/login");
    }
  }, [isLogged, loading]);

  if (loading) {
    return null;
  }

  return (
    <View className="flex-1 w-full">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 16,
            height: 60,
            width: "90%",
            marginLeft: "5%",
            borderRadius: 50,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 1, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 5,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => {
                const Icon = tab.OutlineIcon;
                const isCameraTab = tab.name === "camera";
                const containerStyles = isCameraTab
                  ? "bg-white shadow shadow-zinc-500 w-20 h-20 -mt-8 rounded-full items-center justify-center"
                  : "flex flex-col items-center justify-center w-20 h-16 mt-6";
                const iconColor = focused ? "#000" : "#71717A";
                const iconSize = isCameraTab ? 32 : 28;
                return (
                  <View className={containerStyles}>
                    <Icon size={iconSize} color={iconColor} />
                    {!isCameraTab && focused && (
                      <Text className="text-black text-base font-medium ml-1">
                        {tab.title}
                      </Text>
                    )}
                  </View>
                );
              },
            }}
          />
        ))}
      </Tabs>
    </View>
  );
};

export default TabsLayout;
