import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
} from "react-native";
import { Edit2Icon, Save, Plus, Minus, PencilIcon } from "lucide-react-native";

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

interface FoodDetectionResultsProps {
  aggregatedDetections: Record<string, number>;
  nutritionData: Record<string, NutritionData | null>;
  onDone: () => void;
}

const FoodDetectionResults: React.FC<FoodDetectionResultsProps> = ({
  aggregatedDetections,
  nutritionData,
  onDone,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [foodCounts, setFoodCounts] =
    useState<Record<string, number>>(aggregatedDetections);
  const [currentNutrition, setCurrentNutrition] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [editedNutrition, setEditedNutrition] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Update foodCounts when aggregatedDetections changes
  useEffect(() => {
    console.log("Detection data changed:", aggregatedDetections);
    if (Object.keys(aggregatedDetections).length > 0) {
      // Convert detected items to initial counts
      const initialCounts: Record<string, number> = {};
      Object.entries(aggregatedDetections).forEach(([foodName, count]) => {
        const foodData = nutritionData[foodName];
        if (foodData?.unit === "gram" && foodData.avg_gram) {
          // For gram-based foods, initialize with the avg_gram value
          initialCounts[foodName] = foodData.avg_gram;
        } else {
          // For piece-based foods, use the detected count
          initialCounts[foodName] = count;
        }
      });
      setFoodCounts(initialCounts);
    }
  }, [aggregatedDetections, nutritionData]);

  const calculateTotals = () => {
    let totalCal = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    Object.entries(foodCounts).forEach(([label, count]) => {
      const foodData = nutritionData[label];
      if (foodData) {
        if (foodData.unit === "gram") {
          const ratio = count / 100;
          totalCal += parseFloat((foodData.cal * ratio).toFixed(1));
          totalCarbs += parseFloat((foodData.carbohydrates * ratio).toFixed(1));
          totalProtein += parseFloat((foodData.protein * ratio).toFixed(1));
          totalFat += parseFloat((foodData.fat * ratio).toFixed(1));
        } else {
          totalCal += parseFloat((foodData.cal * count).toFixed(1));
          totalCarbs += parseFloat((foodData.carbohydrates * count).toFixed(1));
          totalProtein += parseFloat((foodData.protein * count).toFixed(1));
          totalFat += parseFloat((foodData.fat * count).toFixed(1));
        }
      }
    });

    return {
      calories: totalCal || 0,
      carbs: totalCarbs.toFixed(1),
      protein: totalProtein.toFixed(1),
      fat: totalFat.toFixed(1),
    };
  };

  // Initialize nutrition values with calculated totals
  useEffect(() => {
    const totals = calculateTotals();
    const parsedTotals = {
      calories: totals.calories,
      carbs: parseFloat(totals.carbs),
      protein: parseFloat(totals.protein),
      fat: parseFloat(totals.fat),
    };

    setCurrentNutrition(parsedTotals);
    // Also initialize edited nutrition when recalculating
    setEditedNutrition(parsedTotals);
  }, [nutritionData, foodCounts]);

  useEffect(() => {
    if (editMode) {
      startShakeAnimation();
    } else {
      shakeAnimation.stopAnimation();
    }
  }, [editMode]);

  const startShakeAnimation = () => {
    const shake = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && editMode) {
          shake();
        }
      });
    };
    shake();
  };

  const adjustFoodAmount = (foodName: string, increment: boolean) => {
    setFoodCounts((prev) => {
      console.log("Adjusting food amount for:", foodName, increment);
      const currentCount = prev[foodName];
      console.log("Current count:", currentCount);
      const foodData = nutritionData[foodName];

      let newCount = currentCount;

      if (foodData?.unit === "gram") {
        // For gram-based foods, increment/decrement by 1g
        newCount = increment ? currentCount + 1 : Math.max(1, currentCount - 1);
      } else {
        // For piece-based foods, increment/decrement by 1 piece
        newCount = increment ? currentCount + 1 : Math.max(1, currentCount - 1);
      }

      return {
        ...prev,
        [foodName]: newCount,
      };
    });
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Save changes when exiting edit mode
      setCurrentNutrition({ ...editedNutrition });
      console.log("Saving nutrition values:", editedNutrition);
    } else {
      // When entering edit mode, reset edited values to current values
      setEditedNutrition({ ...currentNutrition });
    }
    setEditMode(!editMode);
  };

  return (
    <ScrollView className="flex-1">
      <View className="mb-1">
        {Object.entries(foodCounts).map(([foodName, count]) => {
          const foodData = nutritionData[foodName];
          console.log(`Rendering food item: ${foodName}`, { foodData, count });
          let displayText = "";

          if (foodData?.unit === "piece") {
            displayText = `${count} piece${count > 1 ? "s" : ""}`;
          } else if (foodData?.unit === "gram") {
            displayText = `${count}g`;
          }

          return (
            <View key={foodName} className="mb-4 bg-gray-50 p-4 rounded-xl">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold">{foodName}</Text>
                <View className="flex-row items-center bg-gray-100 rounded-full">
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => adjustFoodAmount(foodName, false)}
                  >
                    <Minus size={18} color="#000" />
                  </TouchableOpacity>
                  <Text className="px-4 text-lg font-medium">
                    {displayText}
                  </Text>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => adjustFoodAmount(foodName, true)}
                  >
                    <Plus size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View className="flex-row flex-wrap justify-between mb-6 gap-3">
        {[
          {
            icon: "🔥",
            label: "Calories",
            value: editMode
              ? editedNutrition.calories
              : currentNutrition.calories,
            key: "calories",
          },
          {
            icon: "🌾",
            label: "Carbs",
            value: editMode ? editedNutrition.carbs : currentNutrition.carbs,
            key: "carbs",
            unit: "g",
          },
          {
            icon: "🥩",
            label: "Protein",
            value: editMode
              ? editedNutrition.protein
              : currentNutrition.protein,
            key: "protein",
            unit: "g",
          },
          {
            icon: "🧈",
            label: "Fat",
            value: editMode ? editedNutrition.fat : currentNutrition.fat,
            key: "fat",
            unit: "g",
          },
        ].map(({ icon, label, value, key, unit = "" }) =>
          editMode ? (
            <TouchableOpacity
              key={label}
              className={`w-2/5 p-3 bg-gray-50 rounded-xl mb-4 flex-row items-center ${
                editMode && focusedField === key ? "border border-gray-300" : ""
              }`}
              style={{
                transform: [
                  {
                    translateX:
                      editMode && focusedField !== key ? shakeAnimation : 0,
                  },
                ],
              }}
              onPress={() => setFocusedField(key)}
            >
              <Text className="text-2xl mr-2">{icon}</Text>
              <View className="flex-1 flex-row items-center">
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">{label}</Text>
                  <TextInput
                    className="text-lg font-semibold"
                    value={String(value)}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const numValue =
                        text === ""
                          ? 0
                          : parseFloat(parseFloat(text).toFixed(1));
                      setEditedNutrition({
                        ...editedNutrition,
                        [key]: numValue,
                      });
                    }}
                    onFocus={() => setFocusedField(key)}
                  ></TextInput>
                </View>
                <PencilIcon size={20} color="black" />
              </View>
            </TouchableOpacity>
          ) : (
            <Animated.View
              key={label}
              className={`w-2/5 p-3 bg-gray-50 rounded-xl mb-4 flex-row items-center `}
            >
              <Text className="text-2xl mr-2">{icon}</Text>
              <View className="flex-1">
                <Text className="text-sm text-gray-500">{label}</Text>
                <Text className="text-lg font-semibold">
                  {value}
                  {unit}
                </Text>
              </View>
            </Animated.View>
          )
        )}
      </View>

      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={toggleEditMode}
          className="flex-1 rounded-2xl mr-2 flex-row justify-center items-center bg-black p-2 gap-2"
        >
          {editMode ? (
            <Save size={20} color="white" />
          ) : (
            <Edit2Icon size={20} color="white" />
          )}
          <Text className="text-center text-white text-lg font-semibold">
            {editMode ? "Save" : "Edit Nutrition"}
          </Text>
        </TouchableOpacity>

        {!editMode && (
          <TouchableOpacity
            className="flex-1 rounded-2xl ml-2 flex-row justify-center items-center border border-black p-2 gap-2"
            onPress={onDone}
          >
            <Save size={20} color="black" />
            <Text className="text-center text-black text-lg font-medium">
              Save
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default FoodDetectionResults;
