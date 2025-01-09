import React from "react";
import {
  Text,
  StyleSheet,
  TextProps,
  StyleProp,
  TextStyle,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

interface GradientTitleProps {
  text: string;
  style?: object;
}

interface TitleProps extends TextProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

const Title: React.FC<TitleProps> = ({ text, style, ...rest }) => {
  return (
    <MaskedView maskElement={<Text style={[styles.title, style]}>{text}</Text>}>
      <LinearGradient
        colors={["#000000", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1.1 }}
      >
        <Text style={[styles.title, style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
});

export default Title;
