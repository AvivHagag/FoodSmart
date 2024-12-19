import React from "react";
import {
  View,
  Text,
  ColorValue,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Tabs } from "expo-router";
import { HomeIcon, MagnifyingGlassIcon } from "react-native-heroicons/outline";
import { History, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraIcon } from "react-native-heroicons/outline";

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
  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Sorry, we need camera permissions to make this work!"
        );
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Check if the operation was canceled
      if (result.canceled) {
        console.log("User canceled the camera");
        return;
      }

      // Handle the captured image
      if (result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log("Captured image URI:", imageUri);
        // You can navigate to a new screen or handle the image as needed
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

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
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
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

      {/* Central Camera Button */}
      <View style={styles.cameraButtonContainer}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={openCamera}
          activeOpacity={0.7}
        >
          <CameraIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraButtonContainer: {
    position: "absolute",
    bottom: 16 + 30, // Adjust as per tab bar height
    left: "50%",
    transform: [{ translateX: -30 }], // Half of button width (60 / 2)
    zIndex: 10,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8cd8be",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default TabsLayout;
