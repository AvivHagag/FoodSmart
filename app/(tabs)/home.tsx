import { SafeAreaView, ScrollView, RefreshControl } from "react-native";
import MainPageHeader from "@/components/Main/header";
import { DashboardScreen } from "@/components/Main/progress-component";
import { RecentlyEaten } from "@/components/Main/recently-eaten";
import { useEffect, useState } from "react";
import { useGlobalContext } from "../context/authprovider";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const { userMeals, fetchMeals, user } = useGlobalContext();
  const meals = userMeals.map((meal) => meal.mealsList);

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
  const recommendedNutrition = {
    protein: Math.round((tdee * 0.3) / 4),
    carbs: Math.round((tdee * 0.4) / 4),
    fat: Math.round((tdee * 0.3) / 9),
  };

  const remaining = {
    calories: Number(Math.max(0, tdee - userData.totalCalories).toFixed(1)),
    protein: Number(
      Math.max(0, recommendedNutrition.protein - userData.totalProtein).toFixed(
        1
      )
    ),
    carbs: Number(
      Math.max(0, recommendedNutrition.carbs - userData.totalCarbs).toFixed(1)
    ),
    fat: Number(
      Math.max(0, recommendedNutrition.fat - userData.totalFats).toFixed(1)
    ),
  };

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
