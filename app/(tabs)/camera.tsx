import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  Button,
  Image,
  ImageSourcePropType,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "@/constants/constants";

interface DetectionResult {
  label: string;
  confidence: number;
}

const CameraScreen: React.FC = () => {
  const [detectedObjects, setDetectedObjects] = useState<DetectionResult[]>([]);
  const [imagePick, setImagePick] = useState<ImageSourcePropType>();
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
        setImagePick({ uri: imageUri });
        console.log("Captured image URI:", imageUri);
        sendImageToBackend(imageUri);
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
        setImagePick({ uri: imageUri });
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

  function calculateAverageConfidence(items: DetectionResult[]) {
    if (!items.length) return 0;
    const total = items.reduce((acc, item) => acc + item.confidence, 0);
    return (total / items.length) * 100;
  }
  const averageConfidence = calculateAverageConfidence(detectedObjects);
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-lg font-bold text-center text-gray-600">
              Processing...
            </Text>
          </View>
        ) : detectedObjects.length > 0 ? (
          <ScrollView
            contentContainerStyle={{ alignItems: "center", padding: 16 }}
          >
            <Text className="text-2xl text-center mb-2">Result</Text>
            <View className="w-full max-w-sm bg-white rounded-xl shadow-md overflow-hidden">
              <View className="mb-6 items-center">
                <Image
                  source={imagePick}
                  className="w-full h-48 rounded-lg border border-gray-300"
                  resizeMode="cover"
                />
              </View>

              <Text className="text-lg font-semibold text-gray-800 mt-4 ml-4">
                Recognized Items
              </Text>
              <View className="flex-row flex-wrap px-4 mt-2">
                {detectedObjects.map((item, idx) => (
                  <View
                    key={idx}
                    className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2"
                  >
                    <Text className="text-blue-600 text-sm font-medium">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-lg font-semibold text-gray-800 mt-4 ml-4">
                Estimated Nutrition
              </Text>
              <View className="border border-gray-300 border-dashed rounded-lg p-3 mx-4 mt-2">
                <Text className="text-gray-500 text-center">
                  Coming soon...
                </Text>
              </View>
              <View className="bg-green-100 rounded-t-lg py-3 mt-4">
                <Text className="text-green-700 font-semibold text-center">
                  Recognition Confidence: {averageConfidence.toFixed(2)}%
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="items-center">
            <Text className="text-base text-gray-500 mb-4 text-center">
              Take a picture or select one from your gallery to detect objects.
            </Text>
            <Button
              title="Open Image Options"
              onPress={openImagePickerOptions}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CameraScreen;
