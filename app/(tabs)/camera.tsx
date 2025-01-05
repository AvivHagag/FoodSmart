// camera.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_URL } from "@/constants/constants";

interface DetectionResult {
  label: string;
  confidence: number;
}

const CameraScreen: React.FC = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [detectedObjects, setDetectedObjects] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageUri) {
      sendImageToBackend(imageUri);
    } else {
      Alert.alert("No Image", "No image URI was provided.");
      router.back();
    }
  }, [imageUri]);

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

  const calculateAverageConfidence = (items: DetectionResult[]) => {
    if (!items.length) return 0;
    const total = items.reduce((acc, item) => acc + item.confidence, 0);
    return (total / items.length) * 100;
  };

  const averageConfidence = calculateAverageConfidence(detectedObjects);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-lg font-semibold mt-4">Processing...</Text>
          </View>
        ) : detectedObjects.length > 0 ? (
          <ScrollView
            contentContainerStyle={{ alignItems: "center", padding: 16 }}
            className="flex-1"
          >
            <Text className="text-2xl font-bold text-center mb-4">Result</Text>
            <View className="w-full max-w-md bg-white rounded-xl shadow-lg p-4">
              <View className="mb-6 items-center">
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg border border-gray-300"
                  resizeMode="cover"
                />
              </View>

              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Recognized Items
              </Text>
              <View className="flex-row flex-wrap mb-4">
                {detectedObjects.map((item, idx) => (
                  <View
                    key={idx}
                    className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2"
                  >
                    <Text className="text-blue-700 text-sm font-medium">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Estimated Nutrition
              </Text>
              <View className="border border-gray-300 border-dashed rounded-lg p-3 mb-4">
                <Text className="text-gray-500 text-center">
                  Coming soon...
                </Text>
              </View>

              <View className="bg-green-100 rounded-t-lg py-3">
                <Text className="text-green-700 font-semibold text-center">
                  Recognition Confidence: {averageConfidence.toFixed(2)}%
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-base text-gray-500 mb-4 text-center">
              No image or recognition results found.
            </Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-full py-3 px-6"
              onPress={() => router.back()}
            >
              <Text className="text-white text-center font-medium">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CameraScreen;
