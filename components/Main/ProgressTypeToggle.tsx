import React from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";

type ProgressType = "ring" | "bar";
interface ProgressTypeToggleProps {
  progressType: ProgressType;
  setProgressType: (t: ProgressType) => void;
}

const TRACK_WIDTH = 120;
const THUMB_WIDTH = 60;
const EDGE_PADDING = 2; // space between thumb and track edge

export const ProgressTypeToggle: React.FC<ProgressTypeToggleProps> = ({
  progressType,
  setProgressType,
}) => {
  const isBar = progressType === "bar"; // thumb right = Bars active
  const thumbAnim = React.useRef(new Animated.Value(isBar ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(thumbAnim, {
      toValue: isBar ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isBar, thumbAnim]);

  const thumbTranslate = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [EDGE_PADDING, TRACK_WIDTH - THUMB_WIDTH - EDGE_PADDING],
  });

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.track}
        onPress={() => setProgressType(isBar ? "ring" : "bar")}
        accessibilityRole="switch"
        accessibilityState={{ checked: isBar }}
      >
        {/* row that spans the track and keeps labels responsive */}
        <View style={styles.labelRow}>
          <Text style={[styles.sideLabel, { opacity: isBar ? 0.25 : 1 }]}>
            Rings
          </Text>
          <Text style={[styles.sideLabel, { opacity: isBar ? 1 : 0.25 }]}>
            Bars
          </Text>
        </View>

        {/* moving thumb with the active label */}
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbTranslate }] },
          ]}
        >
          <Text style={styles.thumbText}>{isBar ? "Bars" : "Rings"}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 8 },

  /* track */
  track: {
    width: TRACK_WIDTH,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB", // gray-200
    justifyContent: "center",
    overflow: "hidden", // keeps labelRow clipping tidy
  },

  /* static labels on the track */
  labelRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14, // responsive edge gap
  },
  sideLabel: {
    marginHorizontal: 3,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280", // gray-500
  },

  /* thumb */
  thumb: {
    position: "absolute",
    top: EDGE_PADDING,
    width: THUMB_WIDTH,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  thumbText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
