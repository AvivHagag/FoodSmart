import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Trophy } from "lucide-react-native";

interface CelebrationBannerProps {
  celebration: string;
}

const CelebrationBanner: React.FC<CelebrationBannerProps> = ({
  celebration,
}) => {
  return (
    <View style={styles.celebrationContainer}>
      <Trophy size={16} color="#FFD700" />
      <Text style={styles.celebrationText} numberOfLines={2}>
        {celebration}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default CelebrationBanner;
