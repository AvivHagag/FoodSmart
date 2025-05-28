import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface RecommendationsListProps {
  recommendations: string[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.recommendationsContainer}>
      <Text style={styles.recommendationsTitle}>Quick Tips:</Text>
      {recommendations.slice(0, 2).map((recommendation, index) => (
        <View key={index} style={styles.recommendationItem}>
          <View style={styles.recommendationBullet} />
          <Text style={styles.recommendationText} numberOfLines={2}>
            {recommendation}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default RecommendationsList;
