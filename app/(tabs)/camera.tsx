import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_URL } from "@/constants/constants";
import { ArrowLeftIcon, ShareIcon, SearchXIcon } from "lucide-react-native";
import FoodDetectionResults from "../../components/FoodDetectionResults";

interface DetectionResult {
  label: string;
  confidence: number;
}

interface NutritionData {
  name: string;
  unit: "piece" | "gram";
  piece_avg_weight: number | null;
  avg_gram: number | null;
  cal: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

const CameraScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const [detectedObjects, setDetectedObjects] = useState<DetectionResult[]>([]);
  const [nutritionData, setNutritionData] = useState<
    Record<string, NutritionData | null>
  >({});
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
      uri,
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

      if (!response.ok) {
        Alert.alert("Error", "Failed to process the image.");
        return;
      }

      const result = await response.json();
      if (!result || !Array.isArray(result)) {
        Alert.alert("Error", "Invalid response format from the server.");
        setLoading(false);
        return;
      }

      setDetectedObjects(result);

      const labels = Array.from(new Set(result.map((r) => r.label)));
      setNutritionData(Object.fromEntries(labels.map((lbl) => [lbl, null])));

      const pairs = await Promise.all(
        labels.map(async (label) => {
          try {
            const res = await fetch(`${BASE_URL}/food`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: label }),
            });
            const data = await res.json();
            return [label, data as NutritionData];
          } catch (err) {
            console.error(`Nutrition fetch failed for ${label}:`, err);
            return [label, null];
          }
        })
      );
      setNutritionData(Object.fromEntries(pairs));
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while processing the image.");
    } finally {
      setLoading(false);
    }
  };

  const aggregatedDetections =
    detectedObjects && detectedObjects.length > 0
      ? detectedObjects.reduce((acc: Record<string, number>, item) => {
          acc[item.label] = (acc[item.label] || 0) + 1;
          return acc;
        }, {})
      : {};
  return (
    <View className="flex-1">
      <View className="relative">
        <Image
          source={{ uri: imageUri }}
          className="w-full h-96"
          resizeMode="cover"
        />
        <TouchableOpacity
          className="absolute top-14 left-4 bg-black/70 p-2 rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeftIcon size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="absolute top-14 right-4 bg-black/70 p-2 rounded-full"
          onPress={() => {
            Alert.alert("Share", "Share functionality to be implemented");
          }}
        >
          <ShareIcon size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 -mt-8 bg-white rounded-t-3xl shadow-lg p-4">
        <Text className="text-2xl font-bold mb-6 text-center">
          {loading
            ? "Analyzing your food..."
            : Object.keys(aggregatedDetections).length > 0
            ? "Detected Food"
            : "No food detected"}
        </Text>

        {loading ? (
          <View className="flex-1 justify-center items-center p-10">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-lg font-semibold mt-4">Processing...</Text>
          </View>
        ) : Object.keys(aggregatedDetections).length > 0 ? (
          <FoodDetectionResults
            aggregatedDetections={aggregatedDetections}
            nutritionData={nutritionData}
            imageUri={imageUri}
          />
        ) : (
          <View className="flex-1 items-center p-6">
            <View className="bg-gray-100 p-6 rounded-full">
              <SearchXIcon size={80} color="#888" />
            </View>
            <Text className="text-2xl font-bold mb-3 text-center">
              No Food Detected
            </Text>
            <Text className="text-gray-600 text-center mb-8">
              We couldn't identify any food items in this image.
            </Text>
            <TouchableOpacity
              className="bg-black py-4 px-8 rounded-full flex-row items-center"
              onPress={() => router.back()}
            >
              <ArrowLeftIcon size={20} color="white" className="mr-2" />
              <Text className="text-white font-semibold text-lg ml-2">
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default CameraScreen;
