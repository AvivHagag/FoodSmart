import React from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface CircleProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CircleProgress({
  percentage,
  size = 100,
  strokeWidth = 8,
  circleColor = "#d4d4d8",
  progressColor = "#000000",
  gradientStart,
  gradientEnd,
  children,
  className,
}: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const gradientId = `gradient-${Math.random().toString(36).substring(2, 9)}`;
  const useGradient = gradientStart && gradientEnd;

  return (
    <View
      className={className || "relative"}
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientStart} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circleColor}
          strokeWidth={strokeWidth}
          opacity={0.25}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={useGradient ? `url(#${gradientId})` : progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
