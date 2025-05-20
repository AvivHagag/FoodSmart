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

// Range options for statistics
const RANGE_OPTIONS = ["Week", "30 Days", "60 Days", "90 Days"];

// Nutrition colors matching progress-component CircleProgress gradientEnd colors
const NUTRITION_COLORS = {
  calories: "#8B5CF6", // Purple from calories circle
  protein: "#0369A1", // Blue from protein circle
  carbs: "#F59E0B", // Yellow/Orange from carbs circle
  fats: "#E11D48", // Red from fats circle
};

const Statistics = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Week");
  const [nutritionData, setNutritionData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: {
      calories: [2100, 1800, 2200, 1950, 2300, 1700, 2000],
      protein: [120, 100, 130, 110, 140, 90, 115],
      carbs: [210, 180, 230, 200, 250, 160, 190],
      fats: [70, 60, 80, 65, 85, 55, 75],
    },
  });
  const [goalProgress, setGoalProgress] = useState({
    calories: { current: 2000, target: 2200, unit: "kcal" },
    protein: { current: 120, target: 150, unit: "g" },
    carbs: { current: 200, target: 250, unit: "g" },
    fats: { current: 65, target: 70, unit: "g" },
  });
  const { user } = useGlobalContext();
  const [activeDataset, setActiveDataset] = useState("calories");

  const screenWidth = Dimensions.get("window").width - 32;

  useEffect(() => {
    fetchStatisticsData();
  }, [selectedRange, user?._id]);

  const fetchStatisticsData = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      // In a real implementation, you would fetch data from your API based on the selected range
      // For now, we'll simulate a delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulating different data for different ranges
      const days =
        selectedRange === "Week"
          ? 7
          : selectedRange === "30 Days"
          ? 30
          : selectedRange === "60 Days"
          ? 60
          : 90;

      const labels = generateLabelsForRange(days);
      const datasets = generateRandomDatasets(days);

      setNutritionData({
        labels,
        datasets,
      });
    } catch (error) {
      console.log("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLabelsForRange = (days: number) => {
    if (days === 7) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }

    // For longer ranges, just use the date numbers or simplified format
    const labels = [];
    for (let i = 0; i < days; i++) {
      if (i % 5 === 0 || i === 0 || i === days - 1) {
        labels.push(`${i + 1}`);
      } else {
        labels.push("");
      }
    }
    return labels;
  };

  const generateRandomDatasets = (days: number) => {
    const calories = [];
    const protein = [];
    const carbs = [];
    const fats = [];

    for (let i = 0; i < days; i++) {
      // Generate random values with some consistency
      calories.push(Math.floor(Math.random() * 1000) + 1500);
      protein.push(Math.floor(Math.random() * 80) + 80);
      carbs.push(Math.floor(Math.random() * 150) + 150);
      fats.push(Math.floor(Math.random() * 40) + 50);
    }

    return { calories, protein, carbs, fats };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatisticsData();
    setRefreshing(false);
  };

  const getProgressPercentage = (current: number, target: number): number => {
    const percentage = (current / target) * 100;
    return Math.min(percentage, 100); // Cap at 100%
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
    return {
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      color: (opacity = 1) =>
        `${
          NUTRITION_COLORS[activeDataset as keyof typeof NUTRITION_COLORS] ||
          "#BE123C"
        }${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")}`,
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

      {/* Range Selector Strip */}
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
        {/* Goal Progress Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderText}>Goal Progress</Text>
          </View>

          <View style={styles.goalsContainer}>{renderGoalProgress()}</View>
        </View>

        {/* Nutrition Data Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderText}>Nutrition Trends</Text>
          </View>

          {/* Dataset Selector */}
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
                      color: (opacity = 1) =>
                        `${
                          NUTRITION_COLORS[
                            activeDataset as keyof typeof NUTRITION_COLORS
                          ] || "#BE123C"
                        }${Math.round(opacity * 255)
                          .toString(16)
                          .padStart(2, "0")}`,
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
