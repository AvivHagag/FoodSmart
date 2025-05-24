import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { MealDetailModal } from "../Main/MealDetailModal";
import { BASE_URL } from "@/constants/constants";

type Meal = {
  _id?: string;
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string;
};

interface RecentlyEatenProps {
  recentMeals: Meal[];
  onRefresh: () => void;
  userId: string;
  mealsID: string;
}

export function RecentlyEaten({
  recentMeals,
  onRefresh,
  userId,
  mealsID,
}: RecentlyEatenProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealOpenModal, setMealOpenModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleMealPress = (meal: Meal) => {
    setSelectedMeal(meal);
    setMealOpenModal(true);
  };

  const handleCloseModal = () => {
    setSelectedMeal(null);
    setMealOpenModal(false);
  };

  const handleDelete = async (meal: Meal) => {
    try {
      if (!mealsID || !userId) {
        Alert.alert("Error", "Missing meal or user information");
        return;
      }
      setIsDeleting(true);
      const response = await fetch(
        `${BASE_URL}/api/user/${userId}/delete_meal`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mealId: mealsID,
            mealName: meal.name,
          }),
        }
      );

      if (response.status === 200) {
        handleCloseModal();
        onRefresh();
      } else {
        Alert.alert("Error", "Failed to delete meal");
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
      Alert.alert(
        "Error",
        "An error occurred while deleting the meal. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const LoadingOverlay = () => (
    <Modal transparent visible={isDeleting} animationType="fade">
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={styles.loadingText}>Deleting meal...</Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ marginBottom: 200 }}>
      <Text className="mb-4 text-lg font-semibold text-gray-700">
        Your meals:
      </Text>
      <View>
        {recentMeals.map((meal, index) => (
          <TouchableOpacity onPress={() => handleMealPress(meal)} key={index}>
            <Card
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
                    <Text className="text-sm text-gray-500">{meal.time}</Text>
                  )}
                </View>
                <View
                  className="flex-row items-center"
                  style={{ marginLeft: -2 }}
                >
                  <FlameIcon color="#F97316" size={16} />
                  <Text className="font-bold text-sm" style={{ marginLeft: 2 }}>
                    {meal.calories.toFixed(1)} calories
                  </Text>
                </View>
                <View className="mt-2 flex-row items-center justify-between w-full">
                  <View className="flex-row items-center">
                    <DumbbellIcon color="#EF4444" size={16} />
                    <Text className="text-sm" style={{ marginLeft: 2 }}>
                      {meal.protein.toFixed(1)}g
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <WheatIcon color="#F59E0B" size={16} />
                    <Text className="text-sm" style={{ marginLeft: 2 }}>
                      {meal.carbo.toFixed(1)}g
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <DropletIcon color="#3B82F6" size={16} />
                    <Text className="text-sm" style={{ marginLeft: 2 }}>
                      {meal.fat.toFixed(1)}g
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          visible={mealOpenModal}
          onClose={handleCloseModal}
          onDelete={() => handleDelete(selectedMeal)}
          onRefresh={onRefresh}
          userId={userId}
          mealsID={mealsID}
        />
      )}
      <LoadingOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
