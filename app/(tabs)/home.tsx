import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  View,
  Text,
} from "react-native";
import MainPageHeader from "@/components/Main/header";
import { DashboardScreen } from "@/components/Main/progress-component";
import { RecentlyEaten } from "@/components/Main/recently-eaten";
import { useEffect, useState } from "react";
import { useGlobalContext } from "../context/authprovider";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const { userMeals, fetchMeals, user } = useGlobalContext();
  const meals = userMeals.map((meal) => meal.mealsList);

  // Calculate daily nutrition data
  const userData = {
    totalCalories: userMeals.reduce(
      (sum, meal) => sum + (meal.totalCalories || 0),
      0
    ),
    totalProtein: userMeals.reduce(
      (sum, meal) => sum + (meal.totalProtein || 0),
      0
    ),
    totalCarbs: userMeals.reduce(
      (sum, meal) => sum + (meal.totalCarbo || 0),
      0
    ),
    totalFats: userMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0),
  };
  const tdee = user?.tdee ? Math.round(user.tdee) : 0;
  console.log("tdee", tdee);
  const recommendedNutrition = {
    protein: Math.round((tdee * 0.3) / 4), // 30% of calories, 4 calories per gram
    carbs: Math.round((tdee * 0.4) / 4), // 40% of calories, 4 calories per gram
    fat: Math.round((tdee * 0.3) / 9), // 30% of calories, 9 calories per gram
  };

  // Calculate remaining calories and macros for the day
  const remaining = {
    calories: Math.max(0, tdee - userData.totalCalories),
    protein: Math.max(0, recommendedNutrition.protein - userData.totalProtein),
    carbs: Math.max(0, recommendedNutrition.carbs - userData.totalCarbs),
    fat: Math.max(0, recommendedNutrition.fat - userData.totalFats),
  };

  console.log("userData", userData);
  console.log("recommendedNutrition", recommendedNutrition);
  console.log("remaining", remaining);

  useEffect(() => {
    fetchMeals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      fetchMeals();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <MainPageHeader burning={userData.totalCalories} />
      <ScrollView
        className="bg-white flex-1 w-full p-4 mt-4"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            title="Pull to refresh"
            titleColor="#000"
          />
        }
      >
        <DashboardScreen
          tdee={tdee}
          consumedCalories={userData.totalCalories}
          recommendedNutrition={recommendedNutrition}
          userData={userData}
          remaining={remaining}
        />
        <RecentlyEaten meals={meals} />
      </ScrollView>
    </SafeAreaView>
  );
}
