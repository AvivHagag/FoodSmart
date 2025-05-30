import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { X, ChefHat, AlertTriangle, Lightbulb } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AIAdviceHeaderProps {
  adviceType: "tips" | "recipe" | "warning";
  title: string;
  onClose: () => void;
}

const AIAdviceHeader: React.FC<AIAdviceHeaderProps> = ({
  adviceType,
  title,
  onClose,
}) => {
  const getIcon = () => {
    switch (adviceType) {
      case "recipe":
        return <ChefHat size={18} color="#fff" />;
      case "warning":
        return <AlertTriangle size={18} color="#fff" />;
      default:
        return <Lightbulb size={18} color="#fff" />;
    }
  };

  return (
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
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
});

export default AIAdviceHeader;
