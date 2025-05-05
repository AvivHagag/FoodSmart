import React from "react";
import { View, Text } from "react-native";
import { CircleProgress } from "./circle-progress";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";

interface DashboardScreenProps {
  tdee?: number;
  consumedCalories?: number;
  recommendedNutrition?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  userData?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  };
  remaining?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function DashboardScreen(props: DashboardScreenProps = {}) {
  const tdee = props.tdee || 0;
  const consumedCalories = props.consumedCalories || 0;
  const recommendedNutrition = props.recommendedNutrition || {
    protein: 0,
    carbs: 0,
    fat: 0,
  };
  const userData = props.userData || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  };
  const remaining = props.remaining || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const caloriesPercentage =
    tdee > 0 ? Math.min(100, Math.round((consumedCalories / tdee) * 100)) : 0;
  const proteinPercentage =
    recommendedNutrition.protein > 0
      ? Math.min(
          100,
          Math.round(
            (userData.totalProtein / recommendedNutrition.protein) * 100
          )
        )
      : 0;
  const carbsPercentage =
    recommendedNutrition.carbs > 0
      ? Math.min(
          100,
          Math.round((userData.totalCarbs / recommendedNutrition.carbs) * 100)
        )
      : 0;
  const fatsPercentage =
    recommendedNutrition.fat > 0
      ? Math.min(
          100,
          Math.round((userData.totalFats / recommendedNutrition.fat) * 100)
        )
      : 0;

  return (
    <View className="flex-1 py-2">
      <Card className="mb-4 flex flex-row items-center justify-center p-6 shadow-md">
        <View className="flex-1">
          <Text className="mb-2 font-bold" style={{ fontSize: 40 }}>
            {remaining.calories}
          </Text>
          <Text className="text-lg text-gray-600">Calories left</Text>
        </View>
        <View className="mt-4">
          <CircleProgress
            percentage={caloriesPercentage}
            size={120}
            strokeWidth={10}
            gradientStart="#27272A"
            gradientEnd="#8B5CF6"
          >
            <FlameIcon width={32} height={32} color="#000000" />
          </CircleProgress>
        </View>
      </Card>

      <View className="mb-6 flex flex-row flex-wrap justify-between">
        <Card className="p-4 shadow-md mb-4 w-[30%]">
          <Text className="text-2xl font-bold">{remaining.protein}g</Text>
          <Text className="mb-4 text-sm text-gray-600">Protein left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={proteinPercentage}
              size={80}
              strokeWidth={8}
              gradientStart="#38BDF8"
              gradientEnd="#0369A1"
            >
              <DumbbellIcon className="h-5 w-5" color="#000000" />
            </CircleProgress>
          </View>
        </Card>

        <Card className="p-4 shadow-md mb-4 w-[30%]">
          <Text className="text-2xl font-bold">{remaining.carbs}g</Text>
          <Text className="mb-4 text-sm text-gray-600">Carbs left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={carbsPercentage}
              size={80}
              strokeWidth={8}
              gradientStart="#FBBF24"
              gradientEnd="#F59E0B"
            >
              <WheatIcon className="h-5 w-5" color="#000000" />
            </CircleProgress>
          </View>
        </Card>

        <Card className="p-4 shadow-md mb-4 w-[30%]">
          <Text className="text-2xl font-bold">{remaining.fat}g</Text>
          <Text className="mb-4 text-sm text-gray-600">Fats left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={fatsPercentage}
              size={80}
              strokeWidth={8}
              gradientStart="#BE123C"
              gradientEnd="#E11D48"
            >
              <DropletIcon className="h-5 w-5" color="#000000" />
            </CircleProgress>
          </View>
        </Card>
      </View>
    </View>
  );
}
