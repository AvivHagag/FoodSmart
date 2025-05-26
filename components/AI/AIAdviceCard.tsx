import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  onClose: () => void;
}

const { width } = Dimensions.get("window");

const AIAdviceCard: React.FC<AIAdviceCardProps> = ({ advice, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  const getGradientColors = (): [string, string] => {
    switch (advice.advice_type) {
      case "recipe":
        return ["#FF6B6B", "#FF8E53"];
      case "warning":
        return ["#FF9500", "#FF5722"];
      default:
        return ["#4ECDC4", "#44A08D"];
    }
  };

  // Recipe carousel slides: 0 = image, 1 = ingredients, 2 = instructions
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
        // Recipe Image
        const imageUrl =
          advice.recipe.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center";
        console.log("Rendering image with URL:", imageUrl);

        return (
          <Image
            source={{ uri: imageUrl }}
            style={styles.recipeImage}
            resizeMode="cover"
            onError={(error) => {
              console.log("Failed to load recipe image:", imageUrl);
              console.log("Error details:", error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log("Successfully loaded image:", imageUrl);
            }}
          />
        );

      case 1:
        // Ingredients
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
        // Instructions
        return (
          <ScrollView
            style={styles.slideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.instructionsContainer}>
              {advice.recipe.instructions &&
              advice.recipe.instructions.length > 0 ? (
                advice.recipe.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))
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

          {/* Navigation Arrows */}
          <TouchableOpacity style={styles.prevButton} onPress={prevSlide}>
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>

          {/* Slide Header Overlay */}
          <View style={styles.slideOverlay}>
            <View style={styles.slideHeader}>
              {getSlideIcon()}
              <Text style={styles.slideTitle}>{getSlideTitle()}</Text>
            </View>
          </View>
        </View>

        {/* Nutrition Info - Only show on image slide */}
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

        {/* Slide Indicators */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSlideIndex(index)}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentSlideIndex ? "#FF6B6B" : "#E0E0E0",
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
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
            <Lightbulb size={14} color="#4ECDC4" />
            <Text style={styles.microTipText} numberOfLines={2}>
              {advice.micro_tip}
            </Text>
          </View>
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8860B",
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
    height: 160,
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
    padding: 12,
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
    backgroundColor: "#FF6B6B",
    marginRight: 10,
    marginTop: 6,
  },
  ingredientText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#2C3E50",
    flex: 1,
  },
  instructionsContainer: {
    paddingVertical: 4,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF6B6B",
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
    color: "#2C3E50",
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
    backgroundColor: "#4ECDC4",
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E8F8F5",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  microTipText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#34495E",
    marginLeft: 6,
    flex: 1,
  },
});

export default AIAdviceCard;
