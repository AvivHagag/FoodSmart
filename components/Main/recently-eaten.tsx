import React from "react";
import { View, Text, Image } from "react-native";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";

interface MealItem {
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string;
}

interface RecentlyEatenProps {
  meals: MealItem[][] | MealItem[];
}

export function RecentlyEaten({ meals }: RecentlyEatenProps) {
  const recentMeals: MealItem[] = Array.isArray(meals[0])
    ? (meals[0] as MealItem[])
    : (meals as MealItem[]);
  return (
    <View>
      <Text className="mb-4 text-2xl font-bold">Recently eaten</Text>
      <View>
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
                {meal.imageUri ? (
                  <Image
                    source={{ uri: meal.imageUri }}
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
                    <Text className="text-sm text-gray-500">
                      {new Date(meal.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
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
                      {meal.carbo}g
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <DropletIcon color="#3B82F6" size={16} />
                    <Text className="text-sm" style={{ marginLeft: 2 }}>
                      {meal.fat}g
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </View>
  );
}
