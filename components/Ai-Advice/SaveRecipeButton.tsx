import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Save } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment-timezone";
import { User, Recipe } from "@/assets/types";
import { createMeal } from "@/api/mealsApi";

interface SaveRecipeButtonProps {
  recipe: Recipe;
  user: User;
  onRefresh: () => void;
  onClose: () => void;
}

const SaveRecipeButton: React.FC<SaveRecipeButtonProps> = ({
  recipe,
  user,
  onRefresh,
  onClose,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const saveRecipeAsMeal = async () => {
    try {
      if (!user) {
        Alert.alert("Login Required", "You must be logged in to save a recipe");
        return;
      }

      if (!recipe) {
        Alert.alert("Error", "No recipe to save");
        return;
      }

      setIsSaving(true);

      const now = new Date();
      const day = moment().tz("Asia/Jerusalem").format("YYYY-MM-DD");

      const items = recipe.ingredients.join(", ");

      const mealEntry = {
        items,
        time: now.toISOString(),
        calories: recipe.nutrition.calories,
        fat: recipe.nutrition.fat,
        protein: recipe.nutrition.protein,
        carbo: recipe.nutrition.carbs,
        imageUri: recipe.image || null,
      };

      await createMeal(day, [mealEntry]);

      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Could not save your recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
      onPress={saveRecipeAsMeal}
      disabled={isSaving}
    >
      <LinearGradient
        colors={isSaving ? ["#BDC3C7", "#95A5A6"] : ["#27272A", "#000000"]}
        style={styles.saveButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Save size={16} color="#fff" />
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save Meal"}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  saveButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
});

export default SaveRecipeButton;
