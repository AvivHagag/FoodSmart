import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface FoodItemProps {
  name: string;
  initialCount: number;
  unit: string;
  nutrition: {
    cal: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  piece_avg_weight?: number | null;
  avg_gram?: number | null;
}

const FoodItem: React.FC<FoodItemProps> = ({
  name,
  initialCount,
  unit,
  nutrition,
  piece_avg_weight,
  avg_gram,
}) => {
  const [value, setValue] = useState(
    unit === "gram" ? avg_gram || 0 : initialCount
  );

  const increment = () => setValue((prev) => prev + 1);
  const decrement = () => setValue((prev) => (prev > 1 ? prev - 1 : 1));
  const handleValueChange = (text: string) => {
    const newValue = parseInt(text) || 1;
    setValue(newValue);
  };

  const multiplier =
    unit === "gram" ? value / 100 : (value * (piece_avg_weight || 0)) / 100;

  const totalCalories = nutrition.cal * multiplier;
  const totalProtein = nutrition.protein * multiplier;
  const totalFat = nutrition.fat * multiplier;
  const totalCarbs = nutrition.carbohydrates * multiplier;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-lg shadow-black/10">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">{name}</Text>
        <Text className="text-gray-600">
          {unit === "piece" ? `x${value}` : `${value}g`}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mb-4 bg-gray-50 rounded-full p-1">
        <TouchableOpacity
          onPress={decrement}
          className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm"
          activeOpacity={0.8}
        >
          <MaterialIcons name="remove" size={20} color="#4f46e5" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <TextInput
            className="text-lg font-medium text-gray-900 text-center w-16"
            style={styles.input}
            value={value.toString()}
            onChangeText={handleValueChange}
            keyboardType="numeric"
          />
          <Text className="text-lg font-medium text-gray-900 ml-1">
            {unit === "gram" ? "grams" : "pcs"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={increment}
          className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm"
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-4">
        <View className="flex-1 min-w-[45%] bg-indigo-50 p-3 rounded-lg">
          <Text className="text-sm text-indigo-600 font-medium mb-1">
            Calories
          </Text>
          <Text className="text-xl font-bold text-gray-900">
            {totalCalories.toFixed(0)}
            <Text className="text-sm text-gray-500"> kcal</Text>
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] bg-green-50 p-3 rounded-lg">
          <Text className="text-sm text-green-600 font-medium mb-1">
            Protein
          </Text>
          <Text className="text-xl font-bold text-gray-900">
            {totalProtein.toFixed(1)}
            <Text className="text-sm text-gray-500">g</Text>
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] bg-amber-50 p-3 rounded-lg">
          <Text className="text-sm text-amber-600 font-medium mb-1">Fat</Text>
          <Text className="text-xl font-bold text-gray-900">
            {totalFat.toFixed(1)}
            <Text className="text-sm text-gray-500">g</Text>
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] bg-rose-50 p-3 rounded-lg">
          <Text className="text-sm text-rose-600 font-medium mb-1">Carbs</Text>
          <Text className="text-xl font-bold text-gray-900">
            {totalCarbs.toFixed(1)}
            <Text className="text-sm text-gray-500">g</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 25,
    paddingVertical: 0,
    lineHeight: 0,
  },
});

export default FoodItem;
