import { StyleSheet, Text, View } from "react-native";

export default function Profile() {
  return (
    <View className="bg-lightGreen w-full h-full">
      <Text>Profile Page 222</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
