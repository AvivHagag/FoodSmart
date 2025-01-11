import React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface TitleProps {
  text: string;
  backBottom: () => void;
}

const Title: React.FC<TitleProps> = ({ text, backBottom }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={backBottom} style={styles.leftButton}>
        <ChevronLeft size={24} color="#000000" />
      </TouchableOpacity>
      <Text style={styles.title}>{text}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  leftButton: {
    flex: 1,
  },
  title: {
    flex: 2,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  placeholder: {
    flex: 1,
  },
});

export default Title;
