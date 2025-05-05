import React from "react";
import { View, Text, Image } from "react-native";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";

type Meal = {
  image?: string;
  name: string;
  time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

interface RecentlyEatenProps {
  recentMeals: Meal[];
}

export function RecentlyEaten({ recentMeals }: RecentlyEatenProps) {
  return (
    <View className="p-4" style={{ marginBottom: 200 }}>
      <Text className="mb-4 text-lg font-semibold text-gray-700">
        Your meals:
      </Text>
      <View>
        {recentMeals.map((meal, index) => (
          <Card
            key={index}
            className={`flex-row overflow-hidden shadow-md ${
              index !== recentMeals.length - 1 ? "mb-4" : ""
            }`}
          >
            <View
              style={{
                width: 96,
                height: 96,
                backgroundColor: "#f3f4f6",
                overflow: "hidden",
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
              }}
            >
              {meal.image ? (
                <Image
                  source={{ uri: meal.image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderTopLeftRadius: 10,
                    borderBottomLeftRadius: 10,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f3f4f6",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <FlameIcon color="#BE123C" size={32} opacity={0.5} />
                </View>
              )}
            </View>
            <View className="flex-1 flex-col justify-between p-4">
              <View className="flex-row justify-between">
                <Text className="font-bold text-base">{meal.name}</Text>
                {meal.time && (
                  <Text className="text-sm text-gray-500">{meal.time}</Text>
                )}
              </View>
              <View
                className="flex-row items-center"
                style={{ marginLeft: -2 }}
              >
                <FlameIcon color="#F97316" size={16} />
                <Text className="font-bold text-sm" style={{ marginLeft: 2 }}>
                  {meal.calories} calories
                </Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between w-full">
                <View className="flex-row items-center">
                  <DumbbellIcon color="#EF4444" size={16} />
                  <Text className="text-sm" style={{ marginLeft: 2 }}>
                    {meal.protein}g
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <WheatIcon color="#F59E0B" size={16} />
                  <Text className="text-sm" style={{ marginLeft: 2 }}>
                    {meal.carbs}g
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <DropletIcon color="#3B82F6" size={16} />
                  <Text className="text-sm" style={{ marginLeft: 2 }}>
                    {meal.fats}g
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}
