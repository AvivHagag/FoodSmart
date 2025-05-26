import { View, Image, Text, TouchableOpacity } from "react-native";
import { Brain, Flame } from "lucide-react-native";

interface MainPageHeaderProps {
  burning: number;
  onAskAI?: () => void;
}

function MainPageHeader({ burning, onAskAI }: MainPageHeaderProps) {
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

      <TouchableOpacity
        style={{
          backgroundColor: "#e5e7eb",
          paddingHorizontal: 8,
          paddingVertical: 5,
        }}
        className="flex-row items-center gap-2 rounded-full shadow-sm"
        onPress={onAskAI}
        activeOpacity={0.7}
      >
        <Brain size={20} color="#000" style={{ marginRight: 4 }} />
        <Text className="font-semibold" style={{ color: "#f97316" }}>
          Ask AI
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default MainPageHeader;
