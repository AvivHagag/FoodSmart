import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useGlobalContext } from "@/app/context/authprovider";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { BASE_URL } from "@/constants/constants";

const RANGE_OPTIONS = ["Week", "30 Days", "60 Days", "90 Days"];

const NUTRITION_COLORS = {
  calories: "#8B5CF6",
  protein: "#0369A1",
  carbs: "#F59E0B",
  fats: "#E11D48",
};

interface MealData {
  _id: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalFat: number;
  totalProtein: number;
  totalCarbo: number;
  mealsList: any[];
}

interface UserGoals {
  tdee: number;
  goal: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface GoalProgress {
  calories: { current: number; target: number; unit: string };
  protein: { current: number; target: number; unit: string };
  carbs: { current: number; target: number; unit: string };
  fats: { current: number; target: number; unit: string };
}

const Statistics = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Week");
  const [nutritionData, setNutritionData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: {
      calories: [0, 0, 0, 0, 0, 0, 0],
      protein: [0, 0, 0, 0, 0, 0, 0],
      carbs: [0, 0, 0, 0, 0, 0, 0],
      fats: [0, 0, 0, 0, 0, 0, 0],
    },
  });
  const [goalProgress, setGoalProgress] = useState<GoalProgress>({
    calories: { current: 0, target: 2000, unit: "kcal" },
    protein: { current: 0, target: 150, unit: "g" },
    carbs: { current: 0, target: 250, unit: "g" },
    fats: { current: 0, target: 70, unit: "g" },
  });
  const { user } = useGlobalContext();
  const [activeDataset, setActiveDataset] = useState("calories");

  const screenWidth = Dimensions.get("window").width - 32;

  useEffect(() => {
    fetchStatisticsData();
  }, [selectedRange, user?._id]);

  const calculateNutritionGoals = (userGoals: UserGoals): NutritionGoals => {
    const tdee = userGoals?.tdee || 2000;
    const targetCalories = tdee;
    const targetProtein = Math.round((targetCalories * 0.3) / 4);
    const targetCarbs = Math.round((targetCalories * 0.4) / 4);
    const targetFats = Math.round((targetCalories * 0.3) / 9);

    return {
      calories: Math.round(targetCalories),
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats,
    };
  };

  const getDateRange = (rangeType: string) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date();

    if (rangeType === "Week") {
      startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (rangeType === "30 Days") {
      startDate = new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else if (rangeType === "60 Days") {
      startDate = new Date(endDate.getTime() - 59 * 24 * 60 * 60 * 1000);
    } else if (rangeType === "90 Days") {
      startDate = new Date(endDate.getTime() - 89 * 24 * 60 * 60 * 1000);
    }

    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  };

  const generateLabelsForRange = (
    rangeType: string,
    startDate: Date,
    endDate: Date
  ) => {
    const labels = [];
    const currentDate = new Date(startDate);
    const daysCount =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      ) + 1;

    for (let i = 0; i < daysCount; i++) {
      if (rangeType === "Week") {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        labels.push(dayNames[currentDate.getDay()]);
      } else if (rangeType === "30 Days") {
        if (i % 5 === 0 || i === 0 || i === daysCount - 1) {
          labels.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
        } else {
          labels.push("");
        }
      } else if (rangeType === "60 Days") {
        if (i % 10 === 0 || i === 0 || i === daysCount - 1) {
          labels.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
        } else {
          labels.push("");
        }
      } else if (rangeType === "90 Days") {
        if (i % 15 === 0 || i === 0 || i === daysCount - 1) {
          labels.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
        } else {
          labels.push("");
        }
      } else {
        labels.push(`${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return labels;
  };

  const processNutritionData = (
    meals: MealData[],
    rangeType: string,
    startDate: Date,
    endDate: Date
  ) => {
    const dailyNutrition: {
      [key: string]: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    } = {};

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      dailyNutrition[dateKey] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    meals.forEach((meal) => {
      const mealDate = new Date(meal.date);
      const dateKey = mealDate.toISOString().split("T")[0];

      if (dailyNutrition[dateKey]) {
        dailyNutrition[dateKey].calories += meal.totalCalories || 0;
        dailyNutrition[dateKey].protein += meal.totalProtein || 0;
        dailyNutrition[dateKey].carbs += meal.totalCarbo || 0;
        dailyNutrition[dateKey].fats += meal.totalFat || 0;
      }
    });

    const sortedDates = Object.keys(dailyNutrition).sort();
    const caloriesData = sortedDates.map(
      (date) => dailyNutrition[date].calories
    );
    const proteinData = sortedDates.map((date) => dailyNutrition[date].protein);
    const carbsData = sortedDates.map((date) => dailyNutrition[date].carbs);
    const fatsData = sortedDates.map((date) => dailyNutrition[date].fats);

    const labels = generateLabelsForRange(rangeType, startDate, endDate);

    return {
      labels,
      datasets: {
        calories: caloriesData,
        protein: proteinData,
        carbs: carbsData,
        fats: fatsData,
      },
      dailyNutrition,
    };
  };

  const calculateGoalProgress = (
    dailyNutrition: any,
    nutritionGoals: NutritionGoals
  ): GoalProgress => {
    const values = Object.values(dailyNutrition) as any[];
    const daysWithData = values.filter((day) => day.calories > 0);
    const totalDays = daysWithData.length || 1;

    const avgCalories =
      values.reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const avgProtein =
      values.reduce((sum, day) => sum + day.protein, 0) / totalDays;
    const avgCarbs =
      values.reduce((sum, day) => sum + day.carbs, 0) / totalDays;
    const avgFats = values.reduce((sum, day) => sum + day.fats, 0) / totalDays;

    return {
      calories: {
        current: Math.round(avgCalories),
        target: nutritionGoals.calories,
        unit: "kcal",
      },
      protein: {
        current: Math.round(avgProtein),
        target: nutritionGoals.protein,
        unit: "g",
      },
      carbs: {
        current: Math.round(avgCarbs),
        target: nutritionGoals.carbs,
        unit: "g",
      },
      fats: {
        current: Math.round(avgFats),
        target: nutritionGoals.fats,
        unit: "g",
      },
    };
  };

  const fetchStatisticsData = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/api/statistics/${user._id}?range=${selectedRange}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch statistics: ${response.status}`);
      }

      const data = await response.json();
      const nutritionGoals = calculateNutritionGoals(data.userGoals);
      const { startDate, endDate } = getDateRange(selectedRange);
      const processedData = processNutritionData(
        data.meals,
        selectedRange,
        startDate,
        endDate
      );
      const goalProgressData = calculateGoalProgress(
        processedData.dailyNutrition,
        nutritionGoals
      );

      setNutritionData(processedData);
      setGoalProgress(goalProgressData);
    } catch (error) {
      console.log("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatisticsData();
    setRefreshing(false);
  };

  const getProgressPercentage = (current: number, target: number): number => {
    const percentage = (current / target) * 100;
    return Math.min(percentage, 100);
  };

  const renderGoalProgress = () => {
    return Object.entries(goalProgress).map(([key, value]) => (
      <View key={key} style={styles.goalItem}>
        <View style={styles.goalTextContainer}>
          <Text style={styles.goalTitle}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Text>
          <Text style={styles.goalValues}>
            {value.current} / {value.target} {value.unit}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${getProgressPercentage(value.current, value.target)}%`,
                backgroundColor:
                  NUTRITION_COLORS[key as keyof typeof NUTRITION_COLORS] ||
                  "#BE123C",
              },
            ]}
          />
        </View>
      </View>
    ));
  };

  const getChartConfig = () => {
    const colorHex =
      NUTRITION_COLORS[activeDataset as keyof typeof NUTRITION_COLORS] ||
      "#BE123C";
    return {
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: (opacity = 1) => {
        const alpha = Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0");
        return `${colorHex}${alpha}`;
      },
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      <View style={styles.rangeStripContainer}>
        <Text style={styles.rangeTitle}>Select Range</Text>
        <FlatList
          data={RANGE_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rangeStrip}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedRange === item;
            return (
              <TouchableOpacity
                style={[
                  styles.rangeItem,
                  isSelected && styles.selectedRangeItem,
                ]}
                onPress={() => setSelectedRange(item)}
              >
                <Text
                  style={[
                    styles.rangeItemText,
                    isSelected && styles.selectedRangeItemText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#BE123C"
            title="Pull to refresh"
            titleColor="#BE123C"
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderText}>Daily Average vs Goals</Text>
          </View>

          <View style={styles.goalsContainer}>{renderGoalProgress()}</View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderText}>Nutrition Trends</Text>
          </View>

          <View style={styles.datasetSelector}>
            {Object.keys(nutritionData.datasets).map((dataset) => (
              <TouchableOpacity
                key={dataset}
                style={[
                  styles.datasetButton,
                  activeDataset === dataset && {
                    ...styles.datasetButtonActive,
                    backgroundColor:
                      NUTRITION_COLORS[
                        dataset as keyof typeof NUTRITION_COLORS
                      ] || "#BE123C",
                  },
                ]}
                onPress={() => setActiveDataset(dataset)}
              >
                <Text
                  style={[
                    styles.datasetButtonText,
                    activeDataset === dataset && styles.datasetButtonTextActive,
                  ]}
                >
                  {dataset.charAt(0).toUpperCase() + dataset.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#BE123C" />
              <Text style={styles.loaderText}>Loading data...</Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: nutritionData.labels,
                  datasets: [
                    {
                      data: nutritionData.datasets[
                        activeDataset as keyof typeof nutritionData.datasets
                      ],
                      color: (opacity = 1) => {
                        const colorHex =
                          NUTRITION_COLORS[
                            activeDataset as keyof typeof NUTRITION_COLORS
                          ] || "#BE123C";
                        const alpha = Math.round(opacity * 255)
                          .toString(16)
                          .padStart(2, "0");
                        return `${colorHex}${alpha}`;
                      },
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth}
                height={220}
                chartConfig={getChartConfig()}
                bezier
                style={styles.chart}
                withDots={false}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </View>
          )}
          <View className="mt-48"></View>
        </View>
      </ScrollView>
      <View className="bg-white -mt-52 h-12"></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  rangeStripContainer: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  rangeStrip: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 4,
    width: "100%",
  },
  rangeItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  selectedRangeItem: {
    backgroundColor: "#BE123C",
  },
  rangeItemText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedRangeItemText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    height: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderLine: {
    width: 4,
    height: 20,
    backgroundColor: "#BE123C",
    marginRight: 8,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  goalsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  goalValues: {
    fontSize: 14,
    color: "#666",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#BE123C",
    borderRadius: 4,
  },
  datasetSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  datasetButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  datasetButtonActive: {
    backgroundColor: "#BE123C",
  },
  datasetButtonText: {
    fontSize: 12,
    color: "#333",
  },
  datasetButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    borderRadius: 10,
    padding: 10,
  },
  loaderContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});

export default Statistics;
