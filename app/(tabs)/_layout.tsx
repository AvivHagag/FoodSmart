import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useGlobalContext } from "../context/authprovider";
import {
  View,
  Text,
  ColorValue,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
} from "react-native";
import { Tabs } from "expo-router";
import {
  Home,
  History,
  ChartNoAxesCombined,
  User,
  Camera as CameraIcon,
  Images,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

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
    OutlineIcon: CameraIcon,
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    if (!loading && !isLogged) {
      router.replace("/(auth)/login");
    }
  }, [isLogged, loading]);

  if (loading) {
    return null;
  }

  const navigateToCamera = (imageUri: string) => {
    closeModal();
    router.replace({
      pathname: "/(tabs)/camera",
      params: { imageUri },
    });
  };

  const openImagePickerOptions = () => {
    toggleModal();
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Sorry, we need camera permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        console.log("User canceled the camera");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        navigateToCamera(imageUri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

  const openGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Sorry, we need gallery permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (result.canceled) {
        console.log("User canceled selecting from gallery");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        navigateToCamera(imageUri);
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
    }
  };

  const CameraTabBarButton = () => {
    return (
      <TouchableOpacity
        onPress={openImagePickerOptions}
        activeOpacity={0.7}
        className="bg-white shadow shadow-zinc-500 w-20 h-20 -mt-8 rounded-full items-center justify-center tra"
      >
        {isModalVisible ? (
          <X size={32} color={"#000"} />
        ) : (
          <CameraIcon size={32} color={"#000"} />
        )}
      </TouchableOpacity>
    );
  };

  const openModal = () => {
    setIsModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  const toggleModal = () => {
    if (isModalVisible) {
      closeModal();
    } else {
      openModal();
    }
  };

  return (
    <View className="flex-1 w-full">
      <StatusBar barStyle="dark-content" />
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
        {tabs.map((tab) => {
          const isCameraTab = tab.name === "camera";
          return (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                ...(isCameraTab
                  ? {
                      tabBarButton: () => <CameraTabBarButton />,
                    }
                  : {
                      tabBarIcon: ({ focused }) => {
                        const Icon = tab.OutlineIcon;
                        return (
                          <View className="flex flex-col items-center justify-center w-20 h-16 mt-6">
                            <Icon
                              size={28}
                              color={focused ? "#000" : "#71717A"}
                            />
                            {focused && (
                              <Text className="text-black text-base font-medium ml-1">
                                {tab.title}
                              </Text>
                            )}
                          </View>
                        );
                      },
                    }),
              }}
            />
          );
        })}
      </Tabs>
      {isModalVisible && (
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute bottom-32 w-full items-center"
        >
          <View className="w-3/5 max-w-sm rounded-2xl bg-white shadow-md p-4">
            <TouchableOpacity
              className="flex-row items-center gap-3 rounded-xl px-4 py-3 mb-2"
              onPress={openCamera}
            >
              <CameraIcon size={24} color={"black"} />
              <Text className="text-black text-center text-lg font-medium">
                Take Photo
              </Text>
            </TouchableOpacity>
            <View className="w-full h-[1px] bg-zinc-400 mb-2"></View>
            <TouchableOpacity
              className="flex-row items-center gap-3 rounded-xl px-4 py-3"
              onPress={openGallery}
            >
              <Images size={24} color={"black"} />
              <Text className="text-black text-center text-lg font-medium">
                Choose From Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default TabsLayout;
