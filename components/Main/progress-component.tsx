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

export function DashboardScreen() {
  return (
    <View className="flex-1 py-2">
      <Card className="mb-4 flex flex-row items-center justify-center p-6 shadow-md">
        <View className="flex-1">
          <Text className="mb-2 font-bold" style={{ fontSize: 40 }}>
            1123
          </Text>
          <Text className="text-lg text-gray-600">Calories left</Text>
        </View>
        <View className="mt-4">
          <CircleProgress
            percentage={25}
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
          <Text className="text-2xl font-bold">103g</Text>
          <Text className="mb-4 text-sm text-gray-600">Protein left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={30}
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
          <Text className="text-2xl font-bold">132g</Text>
          <Text className="mb-4 text-sm text-gray-600">Carbs left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={35}
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
          <Text className="text-2xl font-bold">20g</Text>
          <Text className="mb-4 text-sm text-gray-600">Fats left</Text>
          <View className="flex justify-center">
            <CircleProgress
              percentage={70}
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
