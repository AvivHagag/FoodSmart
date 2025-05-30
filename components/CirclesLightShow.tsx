import React, { useEffect, useRef, useState } from "react";
import { View, Image, Animated, Easing, Text } from "react-native";

interface AnimatedSphereProps {
  size?: number;
}

const AnimatedSphere: React.FC<AnimatedSphereProps> = ({ size = 80 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const [selectedMessage] = useState(() => {
    const aiMessages = [
      "🧠 AI is thinking...",
      "🔍 Analyzing your nutrition...",
      "⚡ Processing data patterns...",
      "🎯 Calculating recommendations...",
      "🚀 Optimizing your health...",
      "💡 Generating insights...",
      "🌟 Creating magic...",
    ];
    return aiMessages[Math.floor(Math.random() * aiMessages.length)];
  });
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const startAnimations = () => {
    // Rotation animation
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation (slower breathing effect)
    pulseValue.setValue(0);
    Animated.loop(
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 4000, // 4 seconds for one pulse cycle
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  };

  const startTypewriterEffect = () => {
    setDisplayedText("");
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < selectedMessage.length) {
        setDisplayedText(selectedMessage.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          startTypewriterEffect();
        }, 2000);
      }
    }, 75);

    return typeInterval;
  };

  const startCursorBlink = () => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500); // Blink every 500ms

    return cursorInterval;
  };

  useEffect(() => {
    startAnimations();
    const typeInterval = startTypewriterEffect();
    const cursorInterval = startCursorBlink();

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <View style={{ alignItems: "center", marginVertical: 10 }}>
      <Animated.View
        style={{
          transform: [{ rotate: spin }],
          opacity: pulse,
        }}
      >
        <Image
          source={require("../assets/images/SphereBall2.jpg")}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "transparent",
          }}
          resizeMode="contain"
        />
      </Animated.View>

      <Text
        style={{
          marginTop: 15,
          fontSize: 14,
          fontWeight: "500",
          color: "#555",
          textAlign: "center",
          minHeight: 24,
        }}
      >
        {displayedText}
        {showCursor && (
          <Text style={{ color: "#000", fontWeight: "bold" }}>|</Text>
        )}
      </Text>
    </View>
  );
};

export default AnimatedSphere;
