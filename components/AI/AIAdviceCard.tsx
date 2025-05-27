import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import {
  X,
  ChefHat,
  AlertTriangle,
  Lightbulb,
  Trophy,
  ChevronLeft,
  ChevronRight,
  List,
  BookOpen,
  Save,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment-timezone";
import { BASE_URL } from "@/constants/constants";

interface User {
  _id: string;
  email: string;
  fullname: string;
  createdAt?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  image?: string | null;
  gender?: string | null;
  activityLevel?: string | null;
  goal?: string | null;
  bmi?: number | null;
  tdee?: number | null;
}

interface AIAdviceCardProps {
  advice: {
    advice_type: "tips" | "recipe" | "warning";
    title: string;
    message: string;
    specific_recommendations?: string[];
    recipe?: {
      image?: string;
      name: string;
      ingredients: string[];
      instructions: string[];
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
    celebration?: string;
    micro_tip?: string;
  } | null;
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}

const AIAdviceCard: React.FC<AIAdviceCardProps> = ({
  advice,
  user,
  onClose,
  onRefresh,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!advice) return null;

  const getIcon = () => {
    switch (advice.advice_type) {
      case "recipe":
        return <ChefHat size={18} color="#fff" />;
      case "warning":
        return <AlertTriangle size={18} color="#fff" />;
      default:
        return <Lightbulb size={18} color="#fff" />;
    }
  };

  const totalSlides = 3;

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getSlideIcon = () => {
    switch (currentSlideIndex) {
      case 0:
        return <ChefHat size={16} color="#fff" />;
      case 1:
        return <List size={16} color="#fff" />;
      case 2:
        return <BookOpen size={16} color="#fff" />;
      default:
        return <ChefHat size={16} color="#fff" />;
    }
  };

  const getSlideTitle = () => {
    switch (currentSlideIndex) {
      case 0:
        return advice.recipe?.name || "Recipe";
      case 1:
        return "Ingredients";
      case 2:
        return "Instructions";
      default:
        return "Recipe";
    }
  };

  const renderSlideContent = () => {
    if (!advice.recipe) return null;

    switch (currentSlideIndex) {
      case 0:
        const fallbackImageUrl =
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center";
        const imageUrl = imageError
          ? fallbackImageUrl
          : advice.recipe.image || fallbackImageUrl;

        const showIcon = !advice.recipe.image || imageError;

        return (
          <View style={styles.imageContainer}>
            {showIcon ? (
              <View style={styles.recipeIconContainer}>
                <ChefHat size={60} color="#000" />
                <Text style={styles.recipeIconText}>Recipe</Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.recipeImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log("Image failed to load:", imageUrl);
                  if (!imageError) {
                    console.log("Switching to recipe icon");
                    setImageError(true);
                  }
                }}
                onLoad={() => {
                  console.log("Successfully loaded image:", imageUrl);
                }}
              />
            )}
          </View>
        );

      case 1:
        return (
          <ScrollView
            style={styles.slideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ingredientsContainer}>
              {advice.recipe.ingredients &&
              advice.recipe.ingredients.length > 0 ? (
                advice.recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No ingredients available</Text>
              )}
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView
            style={styles.slideContent}
            showsVerticalScrollIndicator={false}
          >
            <View>
              {advice.recipe.instructions &&
              advice.recipe.instructions.length > 0 ? (
                advice.recipe.instructions.map((instruction, index) => {
                  const cleanInstruction = instruction
                    .replace(/^\d+\.?\s*/, "")
                    .trim();

                  return (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.instructionText}>
                        {cleanInstruction}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No instructions available</Text>
              )}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const renderRecipeCarousel = () => {
    if (!advice.recipe) return null;

    return (
      <View style={styles.carouselContainer}>
        <View style={styles.slideContainer}>
          {renderSlideContent()}

          <TouchableOpacity style={styles.prevButton} onPress={prevSlide}>
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.slideOverlay}>
            <View style={styles.slideHeader}>
              {getSlideIcon()}
              <Text style={styles.slideTitle}>{getSlideTitle()}</Text>
            </View>
          </View>
        </View>

        {currentSlideIndex === 0 && (
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {advice.recipe.nutrition.calories}
              </Text>
              <Text style={styles.nutritionLabel}>Cal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {advice.recipe.nutrition.protein}g
              </Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {advice.recipe.nutrition.carbs}g
              </Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {advice.recipe.nutrition.fat}g
              </Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        )}

        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSlideIndex(index)}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentSlideIndex ? "#27272A" : "#E0E0E0",
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const saveRecipeAsMeal = async () => {
    try {
      if (!user) {
        Alert.alert("Login Required", "You must be logged in to save a recipe");
        return;
      }

      if (!advice.recipe) {
        Alert.alert("Error", "No recipe to save");
        return;
      }

      setIsSaving(true);

      const now = new Date();
      const day = moment().tz("Asia/Jerusalem").format("DD/MM/YYYY");

      const items = advice.recipe.ingredients.join(", ");

      const mealEntry = {
        items,
        time: now.toISOString(),
        calories: advice.recipe.nutrition.calories,
        fat: advice.recipe.nutrition.fat,
        protein: advice.recipe.nutrition.protein,
        carbo: advice.recipe.nutrition.carbs,
        imageUri: advice.recipe.image || null,
      };

      const payload = {
        userId: user._id,
        date: day,
        totalCalories: advice.recipe.nutrition.calories,
        totalFat: advice.recipe.nutrition.fat,
        totalProtein: advice.recipe.nutrition.protein,
        totalCarbo: advice.recipe.nutrition.carbs,
        mealsList: [mealEntry],
      };

      const res = await fetch(`${BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save recipe");

      onRefresh();
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Could not save your recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#27272A", "#000000"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {getIcon()}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {advice.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {advice.celebration && (
          <View style={styles.celebrationContainer}>
            <Trophy size={16} color="#FFD700" />
            <Text style={styles.celebrationText} numberOfLines={2}>
              {advice.celebration}
            </Text>
          </View>
        )}

        <Text style={styles.messageText} numberOfLines={3}>
          {advice.message}
        </Text>

        {advice.recipe && renderRecipeCarousel()}

        {advice.specific_recommendations &&
          advice.specific_recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Quick Tips:</Text>
              {advice.specific_recommendations
                .slice(0, 2)
                .map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationBullet} />
                    <Text style={styles.recommendationText} numberOfLines={2}>
                      {recommendation}
                    </Text>
                  </View>
                ))}
            </View>
          )}

        {advice.micro_tip && (
          <View style={styles.microTipContainer}>
            <Lightbulb size={18} color="#fff" />
            <Text style={styles.microTipText} numberOfLines={2}>
              {advice.micro_tip}
            </Text>
          </View>
        )}

        {advice.advice_type === "recipe" && advice.recipe && (
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveRecipeAsMeal}
            disabled={isSaving}
          >
            <LinearGradient
              colors={
                isSaving ? ["#BDC3C7", "#95A5A6"] : ["#27272A", "#000000"]
              }
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Save size={16} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : "Save Recipe"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  celebrationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272A",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2C3E50",
    marginBottom: 12,
  },
  carouselContainer: {
    marginBottom: 12,
  },
  slideContainer: {
    position: "relative",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  slideContent: {
    flex: 1,
    padding: 4,
    marginVertical: 4,
  },
  slideOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
  },
  slideHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  slideTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  ingredientsContainer: {
    paddingVertical: 4,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#27272A",
    marginRight: 10,
    marginTop: 6,
  },
  ingredientText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#2C3E50",
    flex: 1,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  instructionNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#2C3E50",
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#7F8C8D",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  prevButton: {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: [{ translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  nutritionLabel: {
    fontSize: 11,
    color: "#7F8C8D",
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  recommendationsContainer: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#27272A",
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#27272A",
    marginRight: 8,
    marginTop: 6,
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#2C3E50",
    flex: 1,
  },
  microTipContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#000",
  },
  microTipText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#fff",
    marginLeft: 6,
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recipeIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  recipeIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
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

export default AIAdviceCard;
