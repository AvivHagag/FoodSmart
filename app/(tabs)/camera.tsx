import React, { useState } from "react";
import { View, Text, Alert, FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "@/constants/constants";

interface DetectionResult {
  label: string;
  confidence: number;
}

const CameraScreen: React.FC = () => {
  const [detectedObjects, setDetectedObjects] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(false);

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
        sendImageToBackend(imageUri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

  const sendImageToBackend = async (uri: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("image", {
      uri: uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch(`${BASE_URL}/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (response.ok) {
        const result: DetectionResult[] = await response.json();
        setDetectedObjects(result);
      } else {
        Alert.alert("Error", "Failed to process the image.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while processing the image.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      openCamera();
    }, [])
  );

  return (
    <View className="flex-1 items-center justify-center p-4">
      {loading ? (
        <Text className="text-lg font-bold text-gray-600">Processing...</Text>
      ) : detectedObjects.length > 0 ? (
        <FlatList
          data={detectedObjects}
          keyExtractor={(item, index) => `${item.label}-${index}`}
          renderItem={({ item }) => (
            <View className="bg-gray-100 p-4 my-2 rounded-lg w-full">
              <Text className="text-base font-semibold text-gray-800">
                Object: {item.label} ({(item.confidence * 100).toFixed(2)}%)
              </Text>
            </View>
          )}
        />
      ) : (
        <Text className="text-base text-gray-500">
          Take a picture to detect objects.
        </Text>
      )}
    </View>
  );
};

export default CameraScreen;
