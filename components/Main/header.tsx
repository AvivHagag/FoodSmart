import { View, Image, Text } from "react-native";
import { Flame } from "lucide-react-native";

function MainPageHeader({ burning }: { burning: number }) {
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
        style={{
          backgroundColor: "#e5e7eb",
          paddingHorizontal: 8,
          paddingVertical: 5,
        }}
        className="flex-row items-center gap-2 rounded-full shadow-sm"
      >
        <Flame size={20} color="#f97316" style={{ marginRight: 2 }} />
        <Text className="font-bold">{burning}</Text>
      </View>
    </View>
  );
}

export default MainPageHeader;
