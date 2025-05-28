import React from "react";
import { Text, StyleSheet, View, TouchableOpacity, Image } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface TitleProps {
  text: string;
  backBottom: () => void;
  logoutFunction?: boolean;
}

const Title: React.FC<TitleProps> = ({
  text,
  backBottom,
  logoutFunction = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={backBottom} style={styles.leftButton}>
        {logoutFunction ? (
          <Image
            source={require("@/assets/images/logoutIcon.png")}
            style={styles.logoutIcon}
          />
        ) : (
          <ChevronLeft size={24} color="#000000" />
        )}
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
  logoutIcon: {
    width: 32,
    height: 32,
  },
});

export default Title;
