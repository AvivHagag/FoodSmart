import { ArrowUpIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Image } from "react-native";

const SavingModal = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowY = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const [dots, setDots] = useState<string>(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length >= 3) {
          return ".";
        } else {
          return prevDots + ".";
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(arrowY, {
            toValue: -40,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(arrowY, {
            toValue: 0,
            duration: 1,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View
      className="absolute inset-0 z-50 items-center justify-center"
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        zIndex: 50,
      }}
    >
      <View
        className="bg-white p-6 rounded-2xl shadow-lg"
        style={{
          alignItems: "center",
          width: "80%",
          maxWidth: 300,
        }}
      >
        <View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Image
              source={require("@/assets/images/CloudIcon.png")}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={{
              position: "absolute",
              top: 95,
              left: 46,
              transform: [{ translateY: arrowY }],
              opacity: arrowOpacity,
            }}
          >
            <ArrowUpIcon size={28} color="#22c55e" strokeWidth={4} />
          </Animated.View>
        </View>

        <Text className="text-xl font-semibold text-center mb-2 ">
          Saving your meal.
        </Text>
        <Text className="text-gray-500 text-center">
          Please wait while we save your delicious food {dots}
        </Text>
      </View>
    </View>
  );
};

export default SavingModal;
