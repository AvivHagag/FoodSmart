import { View, StyleSheet } from "react-native";

export function BottomSpace() {
  return <View style={styles.bottomSpace} />;
}

const styles = StyleSheet.create({
  bottomSpace: {
    marginVertical: 36, // Equivalent to Tailwind's 'my-40'
  },
});
