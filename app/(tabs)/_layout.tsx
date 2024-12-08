import React from "react";
import { View, Text, ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { HomeIcon, MagnifyingGlassIcon } from "react-native-heroicons/outline";
import { History, User } from "lucide-react-native";

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
    OutlineIcon: HomeIcon,
  },
  {
    name: "search",
    title: "Search",
    OutlineIcon: MagnifyingGlassIcon,
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
  return (
    <View className="flex-1 w-full p-1 bg-lightGreen">
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
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
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
                return (
                  <View
                    className={`flex flex-row items-center justify-center transition duration-500 ${
                      focused ? "bg-[#8cd8be]" : "bg-transparent"
                    } rounded-full w-24 h-16 mt-6`}
                  >
                    <Icon size={28} color={focused ? "#000000" : "#71717A"} />
                    {focused && (
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
