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
import FoodItem from "../../components/FoodItem";

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
  const { imageUri } =
    useLocalSearchParams<{ imageUri: string }>();
  const [detectedObjects, setDetectedObjects] = useState<
    DetectionResult[]
  >([]);
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
    formData.append(
      "image",
      {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any
    );

    try {
      const response = await fetch(
        `${BASE_URL}/detect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        Alert.alert("Error", "Failed to process the image.");
        return;
      }

      const result: DetectionResult[] =
        await response.json();
      setDetectedObjects(result);

      const labels = Array.from(
        new Set(result.map((r) => r.label))
      );
      setNutritionData(
        Object.fromEntries(
          labels.map((lbl) => [lbl, null])
        )
      );

      const pairs = await Promise.all(
        labels.map(async (label) => {
          try {
            const res = await fetch(
              `${BASE_URL}/food`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: label }),
              }
            );
            const data = await res.json();
            return [label, data as NutritionData];
          } catch (err) {
            console.error(
              `Nutrition fetch failed for ${label}:`,
              err
            );
            return [label, null];
          }
        })
      );
      setNutritionData(
        Object.fromEntries(pairs)
      );
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "Error",
        "An error occurred while processing the image."
      );
    } finally {
      setLoading(false);
    }
  };

  const aggregatedDetections = detectedObjects.reduce(
    (acc: Record<string, number>, item) => {
      acc[item.label] = (acc[item.label] || 0) + 1;
      return acc;
    },
    {}
  );

  const calculateAverageConfidence = (
    items: DetectionResult[]
  ) => {
    if (!items.length) return 0;
    const total = items.reduce(
      (acc, item) => acc + item.confidence,
      0
    );
    return (total / items.length) * 100;
  };

  const averageConfidence =
    calculateAverageConfidence(detectedObjects);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator
              size="large"
              color="#000"
            />
            <Text className="text-lg font-semibold mt-4">
              Processing...
            </Text>
          </View>
        ) : Object.keys(aggregatedDetections)
            .length > 0 ? (
          <ScrollView
            contentContainerStyle={{
              alignItems: "center",
              padding: 16,
            }}
            className="flex-1"
          >
            <Text className="text-2xl font-bold text-center mb-4">
              Result
            </Text>
            <View className="w-full max-w-md bg-white rounded-xl shadow-lg p-4">
              <View className="mb-6 items-center">
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg border border-gray-300"
                  resizeMode="cover"
                />
              </View>

              {Object.keys(aggregatedDetections).map(
                (label) => {
                  const food = nutritionData[label];
                  // still fetching?
                  if (food === null) {
                    return (
                      <View
                        key={label}
                        className="bg-yellow-100 p-4 rounded-lg mb-2 items-center"
                      >
                        <ActivityIndicator size="small" />
                        <Text className="text-yellow-800 mt-1">
                          Loading nutrition for {label}…
                        </Text>
                      </View>
                    );
                  }
                  // failed or not found
                  if (!food) {
                    return (
                      <View
                        key={label}
                        className="bg-red-100 p-4 rounded-lg mb-2"
                      >
                        <Text className="text-red-700">
                          No nutrition info for {label}
                        </Text>
                      </View>
                    );
                  }
                  // we have valid data
                  return (
                    <FoodItem
                      key={label}
                      name={food.name}
                      initialCount={
                        aggregatedDetections[label]
                      }
                      unit={food.unit}
                      nutrition={{
                        cal: food.cal,
                        protein: food.protein,
                        fat: food.fat,
                        carbohydrates: food.carbohydrates,
                      }}
                      piece_avg_weight={
                        food.piece_avg_weight
                      }
                      avg_gram={food.avg_gram}
                    />
                  );
                }
              )}

              <View className="bg-green-100 rounded-t-lg py-3">
                <Text className="text-green-700 font-semibold text-center">
                  Recognition Confidence:{" "}
                  {averageConfidence.toFixed(2)}%
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
