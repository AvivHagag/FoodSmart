import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  DropletIcon,
  FlameIcon,
  DumbbellIcon,
  WheatIcon,
  XIcon,
  Edit2 as EditIcon,
  Trash2 as TrashIcon,
  PlusIcon,
  CheckIcon,
} from "lucide-react-native";
import { Card } from "../ui/card";
import { BASE_URL } from "@/constants/constants";

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
  onDelete: () => void;
  onRefresh: () => void;
  isEditing?: boolean;
  userId?: string;
  mealsID?: string;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  visible,
  onClose,
  onDelete,
  onRefresh,
  isEditing: isEditingProp,
  userId,
  mealsID,
}) => {
  const [isEditing, setIsEditing] = useState(isEditingProp || false);
  const [calories, setCalories] = useState(meal.calories.toString());
  const [protein, setProtein] = useState(meal.protein.toString());
  const [carbo, setCarbo] = useState(meal.carbo.toString());
  const [fat, setFat] = useState(meal.fat.toString());
  const [details, setDetails] = useState<string[]>(
    meal.items.split(",").map((d) => d.trim())
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const addDetail = () => {
    setDetails([...details, ""]);
  };

  const updateDetail = (text: string, index: number) => {
    const newDetails = [...details];
    newDetails[index] = text;
    setDetails(newDetails);
  };

  const handleSave = async () => {
    try {
      if (!mealsID || !userId) {
        setErrorMessage("Missing meal or user information");
        return;
      }
      setErrorMessage("");

      const caloriesValue = parseFloat(calories) || 0;
      const proteinValue = parseFloat(protein) || 0;
      const carboValue = parseFloat(carbo) || 0;
      const fatValue = parseFloat(fat) || 0;

      if (
        caloriesValue < 0 ||
        proteinValue < 0 ||
        carboValue < 0 ||
        fatValue < 0
      ) {
        setErrorMessage("Nutritional values cannot be negative");
        return;
      }
      if (
        calories.trim() === "" ||
        protein.trim() === "" ||
        carbo.trim() === "" ||
        fat.trim() === ""
      ) {
        setErrorMessage("Please fill in all nutritional values");
        return;
      }

      const filteredDetails = details.filter((d) => d.trim());
      if (filteredDetails.length === 0) {
        setErrorMessage("Please add at least one meal detail");
        return;
      }

      const originalDetails = meal.items
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);
      const currentDetails = filteredDetails;

      const hasChanges =
        caloriesValue !== meal.calories ||
        proteinValue !== meal.protein ||
        carboValue !== meal.carbo ||
        fatValue !== meal.fat ||
        currentDetails.length !== originalDetails.length ||
        currentDetails.some(
          (detail, index) => detail !== originalDetails[index]
        );

      if (!hasChanges) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);

      const mealData = {
        calories: caloriesValue,
        protein: proteinValue,
        carbo: carboValue,
        fat: fatValue,
        items: currentDetails.join(", "),
      };

      const response = await fetch(
        `${BASE_URL}/api/user/${userId}/update_meal`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mealId: mealsID,
            mealName: meal.name,
            mealData: mealData,
          }),
        }
      );

      if (response.status === 200) {
        setIsEditing(false);
        setErrorMessage("");
        onRefresh();
        Alert.alert("Success", "Meal updated successfully!");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to update meal");
      }
    } catch (error) {
      console.error("Error updating meal:", error);
      setErrorMessage(
        "An error occurred while updating the meal. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {isSaving ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047857" />
            <Text style={styles.loadingText}>Updating meal...</Text>
          </View>
        </View>
      ) : (
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

            <ScrollView contentContainerStyle={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{meal.name}</Text>
                <View style={styles.timeBadge}>
                  <Text style={styles.time}>{meal.time}</Text>
                </View>
              </View>

              <View style={styles.caloriesRow}>
                <View style={styles.flameContainer}>
                  <FlameIcon size={20} color="#F97316" />
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={calories}
                    onChangeText={setCalories}
                  />
                ) : (
                  <View style={styles.calTextWrapper}>
                    <Text style={styles.calText1}>Calories</Text>
                    <Text style={styles.calText2}>
                      {parseFloat(calories).toFixed(1)} kcal
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <DumbbellIcon size={18} color="#EF4444" />
                  {isEditing ? (
                    <TextInput
                      style={styles.inputFieldSmall}
                      keyboardType="numeric"
                      value={protein}
                      onChangeText={setProtein}
                    />
                  ) : (
                    <Text style={styles.macroText}>
                      {parseFloat(protein).toFixed(1)} g
                    </Text>
                  )}
                </View>
                <View style={styles.macroItem}>
                  <WheatIcon size={18} color="#F59E0B" />
                  {isEditing ? (
                    <TextInput
                      style={styles.inputFieldSmall}
                      keyboardType="numeric"
                      value={carbo}
                      onChangeText={setCarbo}
                    />
                  ) : (
                    <Text style={styles.macroText}>
                      {parseFloat(carbo).toFixed(1)} g
                    </Text>
                  )}
                </View>
                <View style={styles.macroItem}>
                  <DropletIcon size={18} color="#3B82F6" />
                  {isEditing ? (
                    <TextInput
                      style={styles.inputFieldSmall}
                      keyboardType="numeric"
                      value={fat}
                      onChangeText={setFat}
                    />
                  ) : (
                    <Text style={styles.macroText}>
                      {parseFloat(fat).toFixed(1)} g
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.sectionLabel}>Details</Text>
              <View style={styles.itemsContainer}>
                {details.map((item, index) => (
                  <View key={index} style={styles.itemRowEdit}>
                    {isEditing ? (
                      <TextInput
                        style={styles.detailInput}
                        value={item}
                        onChangeText={(text) => updateDetail(text, index)}
                      />
                    ) : (
                      <View style={styles.itemRow}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    )}
                    {isEditing && (
                      <TouchableOpacity onPress={() => removeDetail(index)}>
                        <TrashIcon
                          size={20}
                          color="#DC2626"
                          style={{ marginLeft: 4 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity
                    style={styles.addDetailButton}
                    onPress={addDetail}
                  >
                    <PlusIcon size={20} />
                    <Text style={styles.addDetailText}>Add Detail</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditing && errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <View style={styles.actionsContainer}>
                {!isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      style={[styles.actionButton, styles.editButton]}
                    >
                      <EditIcon size={20} color="#3B82F6" />
                      <Text style={[styles.actionText, styles.editText]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onDelete}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <TrashIcon size={20} color="#DC2626" />
                      <Text style={[styles.actionText, styles.deleteText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setIsEditing(false);
                        setErrorMessage("");
                        setCalories(meal.calories.toString());
                        setProtein(meal.protein.toString());
                        setCarbo(meal.carbo.toString());
                        setFat(meal.fat.toString());
                        setDetails(meal.items.split(",").map((d) => d.trim()));
                      }}
                      style={[styles.actionButton, styles.cancelButton]}
                    >
                      <Text style={[styles.actionText, styles.cancelText]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      style={[styles.actionButton, styles.saveButton]}
                    >
                      <CheckIcon size={20} color="#047857" />
                      <Text style={[styles.actionText, styles.saveText]}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </Card>
        </View>
      )}
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
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  timeBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  time: { fontSize: 13, fontWeight: "500", color: "#4B5563" },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  flameContainer: { padding: 8, borderRadius: 100, backgroundColor: "#ffedd4" },
  calTextWrapper: { marginLeft: 8 },
  calText1: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  calText2: { fontSize: 20, fontWeight: "600", color: "#000" },
  macrosContainer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
  },
  macroItem: { flexDirection: "row", alignItems: "center" },
  macroText: { marginLeft: 6, fontSize: 14, color: "#374151" },
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
  },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  itemRowEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#BE123C",
    marginRight: 8,
  },
  itemText: { fontSize: 14, color: "#4B5563", flex: 1 },
  detailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  addDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  addDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#2563EB",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButton: { backgroundColor: "#DBEAFE" },
  deleteButton: { backgroundColor: "#FEE2E2" },
  cancelButton: { backgroundColor: "#E5E7EB" },
  saveButton: { backgroundColor: "#D1FAE5" },
  actionText: { marginLeft: 8, fontSize: 16, fontWeight: "600" },
  editText: { color: "#3B82F6" },
  deleteText: { color: "#DC2626" },
  cancelText: { color: "#6B7280" },
  saveText: { color: "#047857" },
  inputField: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 80,
    fontSize: 16,
  },
  inputFieldSmall: {
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 50,
    fontSize: 14,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
