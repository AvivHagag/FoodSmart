import React, { useState } from "react";
import { View, Text, Alert, FlatList, Button } from "react-native";
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

  const openImagePickerOptions = () => {
    Alert.alert(
      "Choose an Option",
      "Would you like to take a picture or select one from your gallery?",
      [
        { text: "Take a Picture", onPress: openCamera },
        { text: "Choose from Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
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
        console.log("Captured image URI:", imageUri);
        sendImageToBackend(imageUri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
        console.log("Selected image URI:", imageUri);
        sendImageToBackend(imageUri);
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
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
      openImagePickerOptions();
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
        <View className="items-center">
          <Text className="text-base text-gray-500 mb-4">
            Take a picture or select one from your gallery to detect objects.
          </Text>
          <Button title="Open Image Options" onPress={openImagePickerOptions} />
        </View>
      )}
    </View>
  );
};

export default CameraScreen;

