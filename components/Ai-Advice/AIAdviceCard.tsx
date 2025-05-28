import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AIAdviceHeader from "./AIAdviceHeader";
import CelebrationBanner from "./CelebrationBanner";
import RecipeCarousel from "./RecipeCarousel";
import RecommendationsList from "./RecommendationsList";
import MicroTip from "./MicroTip";
import SaveRecipeButton from "./SaveRecipeButton";
import { User, Advice } from "@/assets/types";

interface AIAdviceCardProps {
  advice: Advice | null;
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
  if (!advice) return null;

  return (
    <View style={styles.container}>
      <AIAdviceHeader
        adviceType={advice.advice_type}
        title={advice.title}
        onClose={onClose}
      />

      <View style={styles.content}>
        {advice.celebration && (
          <CelebrationBanner celebration={advice.celebration} />
        )}

        <Text style={styles.messageText} numberOfLines={3}>
          {advice.message}
        </Text>

        {advice.recipe && <RecipeCarousel recipe={advice.recipe} />}

        {advice.specific_recommendations && (
          <RecommendationsList
            recommendations={advice.specific_recommendations}
          />
        )}

        {advice.micro_tip && <MicroTip microTip={advice.micro_tip} />}

        {advice.advice_type === "recipe" && advice.recipe && (
          <SaveRecipeButton
            recipe={advice.recipe}
            user={user}
            onRefresh={onRefresh}
            onClose={onClose}
          />
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
  content: {
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2C3E50",
    marginBottom: 12,
  },
});

export default AIAdviceCard;
