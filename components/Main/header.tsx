import { View, Image, Text } from "react-native";
import { Flame } from "lucide-react-native";

function MainPageHeader() {
  return (
    <View className="flex-row justify-between items-center px-4">
      <View className="flex-row items-center gap-2">
        <Image
          source={require("@/assets/images/Logo2.png")}
          style={{
            width: 38,
            height: 38,
            transform: [{ rotate: "-15deg" }],
          }}
          className="object-contain"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold">FoodSmart</Text>
      </View>

      <View
        style={{ backgroundColor: "#dadce0" }}
        className="flex-row items-center gap-2 rounded-full px-3 py-1 shadow-sm"
      >
        <Flame size={20} color="#f97316" />
        <Text className="font-bold">0</Text>
      </View>
    </View>
  );
}

export default MainPageHeader;
