import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface AvatarImageProps {
  name: string;
  size: number;
}

const colorMap: { [key: number]: string } = {
  0: "#F87171",
  1: "#60A5FA",
  2: "#34D399",
  3: "#FBBF24",
  4: "#C084FC",
  5: "#F472B6",
  6: "#818CF8",
};

export default function AvatarImage({ name, size }: AvatarImageProps) {
  let initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  if (initials.length === 0) {
    initials = "U";
  } else if (initials.length === 1) {
    initials += initials;
  } else {
    initials = initials.slice(0, 2);
  }
  const colorIndex = name.length % Object.keys(colorMap).length;
  const backgroundColor = colorMap[colorIndex];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size / 2.5 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
