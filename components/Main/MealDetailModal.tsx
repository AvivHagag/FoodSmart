import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
  XIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";

export interface MealItem {
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string;
}

interface MealDetailModalProps {
  meal: MealItem;
  visible: boolean;
  onClose: () => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Card className="w-full max-w-md bg-white rounded-xl overflow-hidden relative">
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XIcon size={24} color="black" />
          </TouchableOpacity>

          {meal.imageUri ? (
            <Image
              source={{ uri: meal.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <FlameIcon size={48} color="#BE123C" opacity={0.3} />
            </View>
          )}

          <View style={styles.contentContainer}>
            <View className="flex flex-row justify-between items-center">
              <Text style={styles.title}>{meal.name}</Text>
              <View style={styles.timeBadge}>
                <Text style={styles.time}>{meal.time}</Text>
              </View>
            </View>
            <View style={styles.caloriesRow}>
              <View style={styles.flameContainer}>
                <FlameIcon size={20} color="#F97316" />
              </View>
              <View className="flex flex-col items-start">
                <Text style={styles.calText1}>Calories</Text>
                <Text style={styles.calText2}>
                  {meal.calories.toFixed(1)} kcal
                </Text>
              </View>
            </View>

            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <DumbbellIcon size={18} color="#EF4444" />
                <Text style={styles.macroText}>
                  {meal.protein.toFixed(1)} g
                </Text>
              </View>
              <View style={styles.macroItem}>
                <WheatIcon size={18} color="#F59E0B" />
                <Text style={styles.macroText}>{meal.carbo.toFixed(1)} g</Text>
              </View>
              <View style={styles.macroItem}>
                <DropletIcon size={18} color="#3B82F6" />
                <Text style={styles.macroText}>{meal.fat.toFixed(1)} g</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Details</Text>
            <View style={styles.itemsContainer}>
              {meal.items.split(",").map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.itemText}>{item.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  closeButton: {
    position: "absolute",
    backgroundColor: "white",
    opacity: 0.8,
    borderRadius: 100,
    top: 8,
    right: 8,
    zIndex: 10,
  },
  image: {
    width: "100%",
    height: 240,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  flameContainer: {
    padding: 8,
    borderRadius: 100,
    backgroundColor: "#ffedd4",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  contentContainer: {
    padding: 16,
  },
  timeBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  time: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  calText1: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  calText2: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  macrosContainer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#374151",
  },
  sectionLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  itemsContainer: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#BE123C",
    marginRight: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
});
