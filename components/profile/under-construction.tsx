import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Construction, Sparkles, Rocket } from "lucide-react-native";
import { BottomSpace } from "../bottom-space";
import Title from "../title";
import { LinearGradient } from "expo-linear-gradient";

interface UnderConstructionProps {
  setShowUnderConstruction: Dispatch<SetStateAction<boolean>>;
}

export default function UnderConstruction({
  setShowUnderConstruction,
}: UnderConstructionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBackBottom = () => {
    setShowUnderConstruction(false);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4">
      <Title text="Get Help" backBottom={handleBackBottom} />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <LinearGradient
          colors={["#fed7aa", "#fdba74", "#fb923c", "#f97316"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-8 mb-6 items-center relative overflow-hidden"
          style={{
            borderRadius: 20,
            shadowColor: "#f97316",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 20,
              right: 30,
              transform: [{ translateY: bounce }],
            }}
          >
            <Sparkles color="#ffffff" size={24} />
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              transform: [{ translateY: bounce }],
            }}
          >
            <Sparkles color="#ffffff" size={16} />
          </Animated.View>

          <View className="mb-6 items-center">
            <Construction color="#ffffff" size={64} />
          </View>

          <Animated.Text
            style={{
              transform: [{ translateY: bounce }],
            }}
            className="text-3xl font-bold text-white mb-4 text-center"
          >
            🚧 Under Construction! 🚧
          </Animated.Text>

          <Text className="text-lg text-white/90 text-center leading-6 font-medium mb-4">
            Our help center is getting a major upgrade!
          </Text>

          <Animated.View
            style={{
              position: "absolute",
              bottom: 38,
              right: 20,
              transform: [{ translateY: bounce }],
            }}
          >
            <Rocket color="#ffffff" size={20} />
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              bottom: 35,
              left: 10,
              transform: [{ translateY: bounce }],
            }}
          >
            <Rocket color="#ffffff" size={20} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
        className="bg-white rounded-2xl p-6 mb-6"
      >
        <Text className="text-2xl text-center mb-4">🛠️</Text>
        <Text className="text-xl font-bold text-gray-800 text-center mb-3">
          Oops! We're Still Building This!
        </Text>
        <Text className="text-gray-600 text-center leading-6 mb-4">
          Our developers are working harder than a one-legged cat in a sandbox
          to get this ready for you! 😸
        </Text>
        <Text className="text-gray-500 text-center text-sm italic">
          In the meantime, try our Contact Support - it actually works! 📞
        </Text>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => setShowUnderConstruction(false)}
          style={{
            backgroundColor: "#fdba74",
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            marginHorizontal: 16,
            marginBottom: 24,
            shadowColor: "#f97316",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text
            style={{
              color: "#000000",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: 18,
            }}
          >
            Take Me Back! 🏃‍♂️
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <BottomSpace />
    </ScrollView>
  );
}
