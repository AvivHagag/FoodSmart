import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  Edit2Icon,
  Save,
  Plus,
  Minus,
  PencilIcon,
  X,
} from "lucide-react-native";
import { BASE_URL } from "@/constants/constants";
import { useGlobalContext } from "../../app/context/authprovider";
import { useRouter } from "expo-router";
import moment from "moment-timezone";

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
  imageUri: string;
  onSaving: boolean;
  setOnSaving: (onSaving: boolean) => void;
}

const FoodDetectionResults: React.FC<FoodDetectionResultsProps> = ({
  aggregatedDetections,
  nutritionData,
  imageUri,
  onSaving,
  setOnSaving,
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
  const { user } = useGlobalContext();
  const [editedNutrition, setEditedNutrition] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const textInputRefs = useRef<Record<string, TextInput | null>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const [editingFood, setEditingFood] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  useEffect(() => {
    if (Object.keys(aggregatedDetections).length > 0) {
      const initialCounts: Record<string, number> = {};
      Object.entries(aggregatedDetections).forEach(([foodName, count]) => {
        const foodData = nutritionData[foodName];
        if (foodData?.unit === "gram" && foodData.avg_gram) {
          initialCounts[foodName] = foodData.avg_gram;
        } else {
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
        } else if (foodData.unit === "piece" && foodData.piece_avg_weight) {
          const ratio = (foodData.piece_avg_weight * count) / 100;
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

  useEffect(() => {
    const totals = calculateTotals();
    const parsedTotals = {
      calories: totals.calories,
      carbs: parseFloat(totals.carbs),
      protein: parseFloat(totals.protein),
      fat: parseFloat(totals.fat),
    };

    setCurrentNutrition(parsedTotals);
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
      const currentCount = prev[foodName];
      const foodData = nutritionData[foodName];
      let newCount = currentCount;
      if (foodData?.unit === "gram") {
        newCount = increment ? currentCount + 1 : Math.max(1, currentCount - 1);
      } else {
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
      setFocusedField(null);
      setCurrentNutrition({ ...editedNutrition });
    } else {
      setEditedNutrition({ ...currentNutrition });
    }
    setEditMode(!editMode);
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const endpoint = `${BASE_URL}/meals/upload`;
      const ext = uri.split(".").pop() || "jpg";
      const formData = new FormData();

      formData.append("image", {
        uri,
        name: `photo.${ext}`,
        type: `image/${ext}`,
      } as any);

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Image upload failed");
      }
      return data.url;
    } catch (e) {
      console.error("Image upload error:", e);
      throw e;
    }
  };

  const saveMeal = async () => {
    try {
      if (!user) {
        alert("You must be logged in to save a meal");
        return;
      }
      setOnSaving(true);
      const imageUrl = await uploadImage(imageUri);
      const now = new Date();
      const day = moment().tz("Asia/Jerusalem").format("DD/MM/YYYY");
      const items = Object.entries(foodCounts)
        .map(([foodName, count]) => (count > 1 ? `${foodName}` : foodName))
        .join(",");

      const mealEntry = {
        items,
        time: now.toISOString(),
        calories: editedNutrition.calories,
        fat: editedNutrition.fat,
        protein: editedNutrition.protein,
        carbo: editedNutrition.carbs,
        imageUri: imageUrl,
      };

      const payload = {
        userId: user._id,
        date: day,
        totalCalories: editedNutrition.calories,
        totalFat: editedNutrition.fat,
        totalProtein: editedNutrition.protein,
        totalCarbo: editedNutrition.carbs,
        mealsList: [mealEntry],
      };

      const res = await fetch(`${BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save meal");
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("Could not save your meal.");
    } finally {
      setOnSaving(false);
    }
  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleRemoveFood = (foodName: string) => {
    setFoodCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[foodName];

      if (Object.keys(newCounts).length === 0) {
        router.push("/");
      }

      return newCounts;
    });
  };

  const handleFoodQuantitySubmit = (foodName: string) => {
    const foodData = nutritionData[foodName];
    let newValue = parseFloat(editingValue);

    if (isNaN(newValue) || newValue < 1) {
      newValue = 1;
    }

    setFoodCounts((prev) => ({
      ...prev,
      [foodName]: newValue,
    }));

    setEditingFood(null);
    setEditingValue("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: keyboardHeight - 90 }}
        style={{ marginBottom: 90 }}
      >
        <View className="mb-1">
          {Object.entries(foodCounts).map(([foodName, count]) => {
            const foodData = nutritionData[foodName];
            let displayText = "";
            if (foodData?.unit === "piece") {
              displayText = `${count} piece${count > 1 ? "s" : ""}`;
            } else if (foodData?.unit === "gram") {
              displayText = `${count}g`;
            }
            return (
              <View
                key={foodName}
                className="mb-4 p-4 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => handleRemoveFood(foodName)}
                      className="mr-2 p-1"
                    >
                      <X size={18} color="#ef4444" />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold">{foodName}</Text>
                  </View>
                  <View className="flex-row items-center bg-gray-100 rounded-full">
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => adjustFoodAmount(foodName, false)}
                    >
                      <Minus size={18} color="#000" />
                    </TouchableOpacity>
                    {editingFood === foodName ? (
                      <TextInput
                        className="px-4 text-lg font-medium"
                        value={editingValue}
                        onChangeText={setEditingValue}
                        keyboardType="numeric"
                        autoFocus
                        onBlur={() => handleFoodQuantitySubmit(foodName)}
                        onSubmitEditing={() =>
                          handleFoodQuantitySubmit(foodName)
                        }
                        style={{ paddingBottom: 10 }}
                      />
                    ) : (
                      <TouchableOpacity
                        className="px-4"
                        onPress={() => {
                          setEditingFood(foodName);
                          setEditingValue(count.toString());
                        }}
                      >
                        <Text className="text-lg font-medium">
                          {displayText}
                        </Text>
                      </TouchableOpacity>
                    )}
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

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 3,
          }}
        >
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
                style={{
                  width: "45%",
                  padding: 12,
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: editMode && focusedField === key ? 1 : 0,
                  borderColor:
                    editMode && focusedField === key
                      ? "#d1d5db"
                      : "transparent",
                  transform: [
                    {
                      translateX:
                        editMode && focusedField !== key ? shakeAnimation : 0,
                    },
                  ],
                }}
                onPress={() => {
                  setFocusedField(key);
                  textInputRefs.current[key]?.focus();
                }}
              >
                <Text className="text-2xl mr-2">{icon}</Text>
                <View className="flex-1 flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-500">{label}</Text>
                    <TextInput
                      ref={(ref) => {
                        textInputRefs.current[key] = ref;
                      }}
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
                    />
                  </View>
                  <PencilIcon size={20} color="black" />
                </View>
              </TouchableOpacity>
            ) : (
              <Animated.View
                key={label}
                style={{
                  width: "45%",
                  padding: 12,
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text className="text-2xl">{icon}</Text>
                <View className="flex-1">
                  <Text className="text-base text-gray-500">{label}</Text>
                  <Text className="text-lg font-semibold">
                    {value}
                    {unit}
                  </Text>
                </View>
              </Animated.View>
            )
          )}
        </View>

        {!onSaving && (
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={toggleEditMode}
              style={{
                flex: 1,
                borderRadius: 16,
                marginRight: 8,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "black",
                padding: 8,
                gap: 8,
              }}
            >
              {editMode ? (
                <Save size={20} color="white" />
              ) : (
                <Edit2Icon size={20} color="white" />
              )}
              <Text className="text-center text-white text-lg font-medium">
                {editMode ? "Save" : "Edit Nutrition"}
              </Text>
            </TouchableOpacity>

            {!editMode && (
              <TouchableOpacity
                className="flex-1 rounded-2xl ml-2 flex-row justify-center items-center border border-black p-2 gap-2"
                onPress={saveMeal}
              >
                <Save size={20} color="black" />
                <Text className="text-center text-black text-lg font-medium">
                  Save
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FoodDetectionResults;
