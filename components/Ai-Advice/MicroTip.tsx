import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lightbulb } from "lucide-react-native";

interface MicroTipProps {
  microTip: string;
}

const MicroTip: React.FC<MicroTipProps> = ({ microTip }) => {
  return (
    <View style={styles.microTipContainer}>
      <Lightbulb size={18} color="#fff" />
      <Text style={styles.microTipText} numberOfLines={2}>
        {microTip}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default MicroTip;
