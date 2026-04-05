import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import MainPageHeader from "@/components/Main/header";
import { DashboardScreen } from "@/components/Main/progress-component";
import { RecentlyEaten } from "@/components/Main/recently-eaten";
import { ProgressBarDashboard } from "@/components/Main/progress-bar-component";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../context/authprovider";
import { ProgressTypeToggle } from "@/components/Main/ProgressTypeToggle";
import AnimatedSphere from "@/components/CirclesLightShow";
import { BASE_URL } from "@/constants/constants";
import AIAdviceCard from "@/components/Ai-Advice/AIAdviceCard";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [progressType, setProgressType] = useState<"ring" | "bar">("ring");
  const [isAILoading, setIsAILoading] = useState(false);
  const [showAIAdvice, setShowAIAdvice] = useState(false);
  const [aiAdvice, setAIAdvice] = useState<any>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const { userMeals, fetchMeals, user, authFetch } = useGlobalContext();
  const meals = userMeals.map((meal) => meal.mealsList);
  const userData = {
    totalCalories: userMeals.reduce(
      (sum, meal) => sum + (meal.totalCalories || 0),
      0,
    ),
    totalProtein: userMeals.reduce(
      (sum, meal) => sum + (meal.totalProtein || 0),
      0,
    ),
    totalCarbs: userMeals.reduce(
      (sum, meal) => sum + (meal.totalCarbo || 0),
      0,
    ),
    totalFats: userMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0),
  };
  const tdee = user?.tdee ? Math.round(user.tdee) : 0;
  const goal = (user?.goal ?? "").toLowerCase();

  // Use goal-based macro splits — consistent with the AI advisor
  const proteinRatio = goal.includes("lose")
    ? 0.35
    : goal.includes("gain") || goal.includes("muscle")
      ? 0.3
      : 0.3;
  const carbRatio = goal.includes("lose")
    ? 0.35
    : goal.includes("gain") || goal.includes("muscle")
      ? 0.45
      : 0.4;
  const fatRatio = goal.includes("lose")
    ? 0.3
    : goal.includes("gain") || goal.includes("muscle")
      ? 0.25
      : 0.3;

  const recommendedNutrition = {
    protein: Math.round((tdee * proteinRatio) / 4),
    carbs: Math.round((tdee * carbRatio) / 4),
    fat: Math.round((tdee * fatRatio) / 9),
  };

  const remaining = {
    calories: Number(Math.max(0, tdee - userData.totalCalories).toFixed(1)),
    protein: Number(
      Math.max(0, recommendedNutrition.protein - userData.totalProtein).toFixed(
        1,
      ),
    ),
    carbs: Number(
      Math.max(0, recommendedNutrition.carbs - userData.totalCarbs).toFixed(1),
    ),
    fat: Number(
      Math.max(0, recommendedNutrition.fat - userData.totalFats).toFixed(1),
    ),
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMeals();
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  };

  const handleAskAI = async () => {
    setIsAILoading(true);
    setShowAIAdvice(false);
    setAIAdvice(null);
    setAIError(null);

    try {
      const response = await authFetch(
        `${BASE_URL}/api/user/${user?._id}/ai-nutrition-advice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date().toISOString().split("T")[0],
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        try {
          const parsed = JSON.parse(data.ai_advice);
          setAIAdvice(parsed);
          setShowAIAdvice(true);
        } catch {
          setAIError(
            "Received an unexpected response from the AI. Please try again.",
          );
        }
      } else {
        setAIError(
          data.message || "Could not generate advice. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error fetching AI advice:", error);
      setAIError("Network error. Please check your connection and try again.");
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <MainPageHeader
        burning={Number(userData.totalCalories.toFixed(1))}
        onAskAI={handleAskAI}
      />
      <ScrollView
        className="bg-white flex-1 w-full px-4 py-2"
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
        {isAILoading && <AnimatedSphere size={70} />}

        {aiError && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <Text className="text-red-700 font-medium text-base mb-2">
              {aiError}
            </Text>
            <TouchableOpacity
              onPress={handleAskAI}
              className="bg-red-600 rounded-xl py-2 px-4 self-start"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {showAIAdvice && aiAdvice && user && (
          <AIAdviceCard
            onRefresh={onRefresh}
            advice={aiAdvice}
            user={user}
            onClose={() => setShowAIAdvice(false)}
          />
        )}

        <ProgressTypeToggle
          progressType={progressType}
          setProgressType={setProgressType}
        />

        {progressType === "ring" ? (
          <DashboardScreen
            tdee={tdee}
            consumedCalories={userData.totalCalories}
            recommendedNutrition={recommendedNutrition}
            userData={userData}
            remaining={remaining}
          />
        ) : (
          <ProgressBarDashboard
            tdee={tdee}
            consumedCalories={userData.totalCalories}
            recommendedNutrition={recommendedNutrition}
            userData={userData}
            remaining={remaining}
          />
        )}

        <RecentlyEaten
          meals={meals}
          userId={user?._id}
          mealsID={userMeals[0]?._id}
          onRefresh={onRefresh}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
