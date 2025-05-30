import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SwipeRow as RawSwipeRow } from "react-native-swipe-list-view";
const SwipeRow: any = RawSwipeRow;
import {
  X as XIcon,
  Edit2 as EditIcon,
  FlameIcon,
  DropletIcon,
  DumbbellIcon,
  WheatIcon,
  UtensilsIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { MealDetailModal } from "./MealDetailModal";
import moment from "moment-timezone";
import { BASE_URL } from "@/constants/constants";

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
  meals?: MealItem[][] | MealItem[];
  userId?: string;
  mealsID?: string;
  onRefresh: () => void;
}

export function RecentlyEaten({
  meals = [],
  userId,
  mealsID,
  onRefresh,
}: RecentlyEatenProps) {
  const initialRaw: MealItem[] = Array.isArray(meals[0])
    ? (meals[0] as MealItem[])
    : (meals as MealItem[]);

  const [dataMeals, setDataMeals] = useState<MealItem[]>(
    initialRaw.map((meal) => ({
      ...meal,
      time: moment(meal.time).tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm"),
    }))
  );
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [mealOpenModal, setMealOpenModal] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const newRaw: MealItem[] = Array.isArray(meals[0])
      ? (meals[0] as MealItem[])
      : (meals as MealItem[]);

    setDataMeals(
      newRaw.map((meal) => ({
        ...meal,
        time: moment(meal.time).tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm"),
      }))
    );
  }, [meals]);

  const handleMealPress = (meal: MealItem) => {
    setIsEditing(false);
    setSelectedMeal(meal);
    setMealOpenModal(true);
  };

  const handleEdit = (meal: MealItem) => {
    setSelectedMeal(meal);
    setMealOpenModal(true);
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setSelectedMeal(null);
    setMealOpenModal(false);
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const handleDelete = async (meal: MealItem) => {
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
        if (openIndex !== null) {
          setOpenIndex(null);
        }
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
    <GestureHandlerRootView style={styles.root}>
      {dataMeals.length > 0 && (
        <Text style={styles.header}>Recently eaten</Text>
      )}
      <View>
        {dataMeals.length > 0 ? (
          dataMeals.map((meal, index) => (
            <View key={index} style={styles.swipeContainer}>
              <SwipeRow
                rightOpenValue={-120}
                disableLeftSwipe={false}
                disableRightSwipe={true}
                onRowOpen={() => setOpenIndex(index)}
                onRowClose={() => setOpenIndex(null)}
              >
                <View
                  style={[
                    styles.actionsContainer,
                    openIndex === index ? {} : { width: 0 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(meal)}
                  >
                    <EditIcon size={20} color="#fff" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(meal)}
                  >
                    <XIcon size={20} color="#fff" />
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity onPress={() => handleMealPress(meal)}>
                    <Card
                      className={`flex-row overflow-hidden shadow-md ${
                        index !== dataMeals.length - 1 ? "mb-4" : ""
                      }`}
                    >
                      <View style={styles.imageContainer}>
                        {meal.imageUri ? (
                          <Image
                            source={{ uri: meal.imageUri }}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholder}>
                            <UtensilsIcon
                              color="#6B7280"
                              size={28}
                              opacity={0.7}
                            />
                          </View>
                        )}
                      </View>
                      <View className="flex-1 flex-col justify-between p-4">
                        <View className="flex-row justify-between">
                          <Text className="font-bold text-base">
                            {meal.name}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {meal.time}
                          </Text>
                        </View>
                        <View
                          className="flex-row items-center"
                          style={{ marginLeft: -2 }}
                        >
                          <FlameIcon color="#F97316" size={16} />
                          <Text
                            className="font-bold text-sm"
                            style={{ marginLeft: 2 }}
                          >
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
                </View>
              </SwipeRow>
            </View>
          ))
        ) : (
          <View className="items-center justify-center py-8">
            <Image
              source={require("@/assets/images/hungry.png")}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <Text className="mt-4 text-center text-gray-500">
              No meals recorded for today
            </Text>
          </View>
        )}
      </View>
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          visible={mealOpenModal}
          onClose={handleCloseModal}
          onDelete={() => handleDelete(selectedMeal)}
          onRefresh={handleRefresh}
          isEditing={isEditing}
          userId={userId}
          mealsID={mealsID}
        />
      )}
      <LoadingOverlay />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: "bold",
  },
  swipeContainer: {
    backgroundColor: "#fff",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    height: "100%",
    backgroundColor: "#fff",
  },
  editButton: {
    backgroundColor: "#52525b",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 96,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  deleteButton: {
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 96,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  imageContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
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
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
