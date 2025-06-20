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
  ChefHat,
  ChevronLeft,
  ChevronRight,
  List,
  BookOpen,
} from "lucide-react-native";
import { Recipe } from "@/assets/types";

interface RecipeCarouselProps {
  recipe: Recipe;
}

const { width: screenWidth } = Dimensions.get("window");

const RecipeCarousel: React.FC<RecipeCarouselProps> = ({ recipe }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

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
        return recipe.name || "Recipe";
      case 1:
        return "Ingredients";
      case 2:
        return "Instructions";
      default:
        return "Recipe";
    }
  };

  const renderSlideContent = () => {
    switch (currentSlideIndex) {
      case 0:
        return (
          <View style={styles.imageContainer}>
            {recipe.image ? (
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
                onError={(error) => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
            ) : (
              <View style={styles.recipeIconContainer}>
                <ChefHat size={60} color="#000" />
                <Text style={styles.recipeIconText}>Recipe</Text>
              </View>
            )}
            {imageError && recipe.image && (
              <View style={styles.recipeIconContainer}>
                <ChefHat size={60} color="#000" />
                <Text style={styles.recipeIconText}>Recipe</Text>
              </View>
            )}
          </View>
        );

      case 1:
        return (
          <ScrollView
            style={styles.slideContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
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
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.instructionsContainer}>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((instruction, index) => {
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

  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselRow}>
        <TouchableOpacity style={styles.sideButton} onPress={prevSlide}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.slideContainer}>
          {renderSlideContent()}

          <View style={styles.slideOverlay}>
            <View style={styles.slideHeader}>
              {getSlideIcon()}
              <Text style={styles.slideTitle}>{getSlideTitle()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.sideButton} onPress={nextSlide}>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {currentSlideIndex === 0 && (
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {recipe.nutrition.calories}
            </Text>
            <Text style={styles.nutritionLabel}>Cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {recipe.nutrition.protein}g
            </Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      )}

      {/* Dots Indicator */}
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

const styles = StyleSheet.create({
  carouselContainer: {
    marginBottom: 12,
  },
  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slideContainer: {
    flex: 1,
    height: Math.min(screenWidth * 0.6, 250),
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    position: "relative",
    boxShadow: "0 0 6px 0 rgba(0, 0, 0, 0.3)",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  slideContent: {
    flex: 1,
    padding: 12,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 50,
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
    flexShrink: 1,
  },
  ingredientsContainer: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingRight: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#27272A",
    marginRight: 12,
    marginTop: 6,
    flexShrink: 0,
  },
  ingredientText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2C3E50",
    flex: 1,
    flexWrap: "wrap",
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingRight: 8,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  instructionNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2C3E50",
    paddingTop: 4,
    flex: 1,
    flexWrap: "wrap",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7F8C8D",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
    flex: 1,
    textAlignVertical: "center",
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexWrap: "wrap",
  },
  nutritionItem: {
    alignItems: "center",
    minWidth: "20%",
    marginVertical: 4,
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
});

export default RecipeCarousel;
