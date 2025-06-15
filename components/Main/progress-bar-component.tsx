import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../ui/card";
import { LinearGradient } from "expo-linear-gradient";

interface ProgressBarProps {
  label: string;
  consumed: number;
  left: number;
  total: number;
  gradientStart: string;
  gradientEnd: string;
  unit: string;
}

function ProgressBar({
  label,
  consumed,
  left,
  total,
  gradientStart,
  gradientEnd,
  unit,
}: ProgressBarProps) {
  const percent =
    total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;

  return (
    <View style={styles.barContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.consumedText}>
          {consumed}
          {unit} <Text style={{ color: gradientEnd }}>●</Text> / {total}
          {unit}
        </Text>
      </View>

      <View style={styles.progressBarBg}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${percent}%` }]}
        />
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.leftText}>
          {left} {unit} left
        </Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
  },
  consumedText: {
    fontSize: 12,
    color: "#6B7280",
  },
  progressBarBg: {
    height: 14,
    width: "100%",
    backgroundColor: "#E5E7EB",
    borderRadius: 7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressBarFill: {
    height: 14,
    borderRadius: 7,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  leftText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  percentText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});

interface ProgressBarDashboardProps {
  tdee: number;
  consumedCalories: number;
  recommendedNutrition: {
    protein: number;
    carbs: number;
    fat: number;
  };
  userData: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  };
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function ProgressBarDashboard(props: ProgressBarDashboardProps) {
  const { tdee, consumedCalories, recommendedNutrition, userData, remaining } =
    props;
  return (
    <View className="flex-1 py-2">
      <Card className="mb-4 p-4 shadow-md">
        <ProgressBar
          label="Calories"
          consumed={Number(consumedCalories.toFixed(1))}
          left={Number(remaining.calories.toFixed(1))}
          total={tdee}
          gradientStart="#EA580C"
          gradientEnd="#FB923C"
          unit="kcal"
        />
        <ProgressBar
          label="Protein"
          consumed={Number(userData.totalProtein.toFixed(1))}
          left={Number(remaining.protein.toFixed(1))}
          total={recommendedNutrition.protein}
          gradientStart="#BE123C"
          gradientEnd="#E11D48"
          unit="g"
        />
        <ProgressBar
          label="Carbs"
          consumed={Number(userData.totalCarbs.toFixed(1))}
          left={Number(remaining.carbs.toFixed(1))}
          total={recommendedNutrition.carbs}
          gradientStart="#F59E0B"
          gradientEnd="#FBBF24"
          unit="g"
        />
        <ProgressBar
          label="Fats"
          consumed={Number(userData.totalFats.toFixed(1))}
          left={Number(remaining.fat.toFixed(1))}
          total={recommendedNutrition.fat}
          gradientStart="#2563EB"
          gradientEnd="#60A5FA"
          unit="g"
        />
      </Card>
    </View>
  );
}
