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
  Alert,
} from "react-native";
import {
  Edit2Icon,
  Save,
  Plus,
  Minus,
  PencilIcon,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { BASE_URL } from "@/constants/constants";
import { useGlobalContext } from "../../app/context/authprovider";
import { useRouter } from "expo-router";
import moment from "moment-timezone";
import type { AnalyzedFoodItem } from "@/app/(tabs)/camera";

interface FoodDetectionResultsProps {
  analyzedItems: AnalyzedFoodItem[];
  imageUri: string;
  onSaving: boolean;
  setOnSaving: (v: boolean) => void;
}

type FoodQuantities = Record<string, number>;

function calcNutrition(item: AnalyzedFoodItem, quantity: number) {
  let grams: number;

  if (item.unit === "piece") {
    // quantity = number of pieces; piece_avg_weight gives g per piece
    const weightPerPiece =
      item.piece_avg_weight ??
      item.estimated_grams / Math.max(item.count ?? 1, 1);
    grams = quantity * weightPerPiece;
  } else {
    // quantity = grams directly
    grams = quantity;
  }

  const ratio = grams / 100;
  return {
    calories: parseFloat((item.cal * ratio).toFixed(1)),
    protein: parseFloat((item.protein * ratio).toFixed(1)),
    fat: parseFloat((item.fat * ratio).toFixed(1)),
    carbs: parseFloat((item.carbohydrates * ratio).toFixed(1)),
  };
}

function calcTotals(items: AnalyzedFoodItem[], quantities: FoodQuantities) {
  return items.reduce(
    (acc, item) => {
      const n = calcNutrition(
        item,
        quantities[item.label] ?? item.estimated_grams,
      );
      acc.calories += n.calories;
      acc.protein += n.protein;
      acc.fat += n.fat;
      acc.carbs += n.carbs;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

function buildItemsString(
  items: AnalyzedFoodItem[],
  quantities: FoodQuantities,
): string {
  return items
    .map((item) => {
      const q = quantities[item.label] ?? item.estimated_grams;
      if (item.unit === "piece") {
        return `${item.label} x${q}`;
      }
      return `${item.label} ${q}g`;
    })
    .join(", ");
}

const FoodDetectionResults: React.FC<FoodDetectionResultsProps> = ({
  analyzedItems,
  imageUri,
  onSaving,
  setOnSaving,
}) => {
    const { user, authFetch } = useGlobalContext();
    const router = useRouter();

    // Initial quantities from AI's estimated_grams / count
    const [quantities, setQuantities] = useState<FoodQuantities>(() => {
      const init: FoodQuantities = {};
      for (const item of analyzedItems) {
        init[item.label] =
          item.unit === "piece" ? (item.count ?? 1) : item.estimated_grams;
      }
      return init;
    });

    const [editMode, setEditMode] = useState(false);
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
    const [fieldErrors, setFieldErrors] = useState({
      calories: false,
      carbs: false,
      protein: false,
      fat: false,
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [editingFood, setEditingFood] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [foodQuantityError, setFoodQuantityError] = useState<string | null>(
      null,
    );
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const textInputRefs = useRef<Record<string, TextInput | null>>({});

    // Active items (user may remove some)
    const [activeItems, setActiveItems] =
      useState<AnalyzedFoodItem[]>(analyzedItems);

    // Recalculate totals whenever quantities or active items change
    useEffect(() => {
      const totals = calcTotals(activeItems, quantities);
      setCurrentNutrition(totals);
      setEditedNutrition(totals);
    }, [quantities, activeItems]);

    useEffect(() => {
      if (editMode) startShake();
      else shakeAnimation.stopAnimation();
    }, [editMode]);

    useEffect(() => {
      const show = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => setKeyboardHeight(e.endCoordinates.height),
      );
      const hide = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => setKeyboardHeight(0),
      );
      return () => {
        show.remove();
        hide.remove();
      };
    }, []);

    const startShake = () => {
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
          if (finished && editMode) shake();
        });
      };
      shake();
    };

    const adjustAmount = (label: string, increment: boolean) => {
      setQuantities((prev) => {
        const curr = prev[label];
        const newVal = increment ? curr + 1 : Math.max(1, curr - 1);
        return { ...prev, [label]: newVal };
      });
    };

    const handleQuantitySubmit = (item: AnalyzedFoodItem) => {
      setFoodQuantityError(null);
      const val = parseFloat(editingValue);

      if (!editingValue.trim() || isNaN(val)) {
        setFoodQuantityError("Please enter a valid number");
        return;
      }
      if (val < 1) {
        setFoodQuantityError("Quantity must be at least 1");
        return;
      }
      if (item.unit === "gram" && val > 2000) {
        setFoodQuantityError("Cannot exceed 2000g");
        return;
      }
      if (item.unit === "piece" && val > 50) {
        setFoodQuantityError("Cannot exceed 50 pieces");
        return;
      }

      setQuantities((prev) => ({ ...prev, [item.label]: val }));
      setEditingFood(null);
      setEditingValue("");
    };

    const removeFood = (label: string) => {
      const next = activeItems.filter((i) => i.label !== label);
      setActiveItems(next);
      if (next.length === 0) router.replace("/(tabs)/home");
    };

    const validateNutrition = () => {
      setFieldErrors({
        calories: false,
        carbs: false,
        protein: false,
        fat: false,
      });
      setErrorMessage("");

      if (!editedNutrition.calories) {
        setFieldErrors((p) => ({ ...p, calories: true }));
        setErrorMessage("Calories field cannot be empty");
        return false;
      }
      if (editedNutrition.calories > 5000) {
        setFieldErrors((p) => ({ ...p, calories: true }));
        setErrorMessage("Calories cannot exceed 5,000 kcal");
        return false;
      }
      if (editedNutrition.protein > 200) {
        setFieldErrors((p) => ({ ...p, protein: true }));
        setErrorMessage("Protein cannot exceed 200g");
        return false;
      }
      if (editedNutrition.carbs > 500) {
        setFieldErrors((p) => ({ ...p, carbs: true }));
        setErrorMessage("Carbohydrates cannot exceed 500g");
        return false;
      }
      if (editedNutrition.fat > 200) {
        setFieldErrors((p) => ({ ...p, fat: true }));
        setErrorMessage("Fat cannot exceed 200g");
        return false;
      }
      return true;
    };

    const toggleEditMode = () => {
      if (editMode) {
        if (!validateNutrition()) return;
        setCurrentNutrition({ ...editedNutrition });
        setFocusedField(null);
        setErrorMessage("");
        setFieldErrors({
          calories: false,
          carbs: false,
          protein: false,
          fat: false,
        });
      } else {
        setEditedNutrition({ ...currentNutrition });
      }
      setEditMode((v) => !v);
    };

    const uploadImage = async (uri: string): Promise<string> => {
      const ext = uri.split(".").pop() || "jpg";
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: `photo.${ext}`,
        type: `image/${ext}`,
      } as any);

      const res = await authFetch(`${BASE_URL}/meals/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");
      return data.url;
    };

    const saveMeal = async () => {
      if (!user) {
        Alert.alert("Error", "You must be logged in to save a meal");
        return;
      }
      setOnSaving(true);
      try {
        const imageUrl = await uploadImage(imageUri);
        const day = moment().tz("Asia/Jerusalem").format("DD/MM/YYYY");
        const items = buildItemsString(activeItems, quantities);

        const mealEntry = {
          items,
          time: new Date().toISOString(),
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

        const res = await authFetch(`${BASE_URL}/meals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save meal");
        router.replace("/(tabs)/home");
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not save your meal.");
      } finally {
        setOnSaving(false);
      }
    };

    const nutrition = editMode ? editedNutrition : currentNutrition;

    const macroCards = [
      { icon: "🔥", label: "Calories", key: "calories" as const, unit: "" },
      { icon: "🌾", label: "Carbs", key: "carbs" as const, unit: "g" },
      { icon: "🥩", label: "Protein", key: "protein" as const, unit: "g" },
      { icon: "🧈", label: "Fat", key: "fat" as const, unit: "g" },
    ];

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
          {/* Food items */}
          <View className="mb-1">
            {activeItems.map((item) => {
              const q =
                quantities[item.label] ??
                (item.unit === "piece"
                  ? (item.count ?? 1)
                  : item.estimated_grams);
              const displayText =
                item.unit === "piece"
                  ? `${q} piece${q !== 1 ? "s" : ""}`
                  : `${q}g`;

              return (
                <View
                  key={item.label}
                  className="mb-4 p-4 rounded-xl"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => removeFood(item.label)}
                        className="mr-2 p-1"
                      >
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <Text className="text-lg font-semibold">
                        {item.label}
                      </Text>
                    </View>

                    <View className="flex-row items-center bg-gray-100 rounded-full">
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => adjustAmount(item.label, false)}
                      >
                        <Minus size={18} color="#000" />
                      </TouchableOpacity>

                      {editingFood === item.label ? (
                        <TextInput
                          className="px-4 text-lg font-medium"
                          value={editingValue}
                          onChangeText={(text) => {
                            setEditingValue(text);
                            setFoodQuantityError(null);
                          }}
                          keyboardType="numeric"
                          autoFocus
                          onBlur={() => handleQuantitySubmit(item)}
                          onSubmitEditing={() => handleQuantitySubmit(item)}
                          style={{
                            paddingBottom: 10,
                            ...(foodQuantityError && {
                              borderWidth: 1,
                              borderColor: "#DC2626",
                              backgroundColor: "#FEF2F2",
                              borderRadius: 4,
                            }),
                          }}
                        />
                      ) : (
                        <TouchableOpacity
                          className="px-4"
                          onPress={() => {
                            setEditingFood(item.label);
                            setEditingValue(q.toString());
                          }}
                        >
                          <Text className="text-lg font-medium">
                            {displayText}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        className="p-2"
                        onPress={() => adjustAmount(item.label, true)}
                      >
                        <Plus size={18} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Macro cards */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 3,
            }}
          >
            {macroCards.map(({ icon, label, key, unit }) =>
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
                    borderWidth: focusedField === key ? 1 : 0,
                    borderColor:
                      focusedField === key ? "#d1d5db" : "transparent",
                    transform: [
                      { translateX: focusedField !== key ? shakeAnimation : 0 },
                    ],
                    ...(fieldErrors[key]
                      ? {
                          borderWidth: 2,
                          borderColor: "#DC2626",
                          backgroundColor: "#FEF2F2",
                        }
                      : {}),
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
                        ref={(r) => {
                          textInputRefs.current[key] = r;
                        }}
                        className="text-lg font-semibold"
                        value={String(nutrition[key])}
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const val =
                            text === ""
                              ? 0
                              : parseFloat(parseFloat(text).toFixed(1));
                          setEditedNutrition((p) => ({ ...p, [key]: val }));
                          if (fieldErrors[key])
                            setFieldErrors((p) => ({ ...p, [key]: false }));
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
                      {nutrition[key].toFixed(1)}
                      {unit}
                    </Text>
                  </View>
                </Animated.View>
              ),
            )}
          </View>

          {/* Error banners */}
          {editMode && errorMessage ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FEF2F2",
                borderColor: "#FECACA",
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                shadowColor: "#DC2626",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <AlertTriangle size={20} color="#DC2626" />
              <Text
                style={{
                  color: "#DC2626",
                  fontSize: 14,
                  fontWeight: "500",
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {foodQuantityError ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FEF2F2",
                borderColor: "#FECACA",
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                shadowColor: "#DC2626",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <AlertTriangle size={20} color="#DC2626" />
              <Text
                style={{
                  color: "#DC2626",
                  fontSize: 14,
                  fontWeight: "500",
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {foodQuantityError}
              </Text>
            </View>
          ) : null}

          {/* Action buttons */}
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
