import React, { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  LayoutAnimation,
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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isEditing]);

  const removeDetail = (i: number) =>
    setDetails(details.filter((_, n) => n !== i));
  const addDetail = () => setDetails([...details, ""]);
  const updateDetail = (t: string, i: number) =>
    setDetails(details.map((d, n) => (n === i ? t : d)));

  const handleSave = async () => {
    try {
      if (!mealsID || !userId) {
        setErrorMessage("Missing meal or user information");
        return;
      }
      const cal = parseFloat(calories) || 0;
      const pro = parseFloat(protein) || 0;
      const car = parseFloat(carbo) || 0;
      const fa = parseFloat(fat) || 0;
      if ([cal, pro, car, fa].some((v) => v < 0)) {
        setErrorMessage("Nutritional values cannot be negative");
        return;
      }
      const trimmedDetails = details.filter((d) => d.trim());
      if (trimmedDetails.length === 0) {
        setErrorMessage("Please add at least one meal detail");
        return;
      }

      const unchanged =
        cal === meal.calories &&
        pro === meal.protein &&
        car === meal.carbo &&
        fa === meal.fat &&
        trimmedDetails.join(",") ===
          meal.items
            .split(",")
            .map((d) => d.trim())
            .join(",");
      if (unchanged) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);

      const resp = await fetch(`${BASE_URL}/api/user/${userId}/update_meal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId: mealsID,
          mealName: meal.name,
          mealData: {
            calories: cal,
            protein: pro,
            carbo: car,
            fat: fa,
            items: trimmedDetails.join(", "),
          },
        }),
      });

      if (resp.status === 200) {
        setIsEditing(false);
        setErrorMessage("");
        onRefresh();
        Alert.alert("Success", "Meal updated successfully!");
      } else {
        const err = await resp.json();
        setErrorMessage(err.message || "Failed to update meal");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("An error occurred; please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {isSaving ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.loadingText}>Updating meal…</Text>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", alignItems: "center" }}
          >
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <Card className="w-full max-w-md bg-white rounded-xl overflow-hidden relative">
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <XIcon size={24} color="#000" />
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

                <ScrollView
                  contentContainerStyle={styles.contentContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
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
                        value={calories}
                        onChangeText={setCalories}
                        keyboardType="numeric"
                        style={styles.inputField}
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
                    {[
                      {
                        Icon: DumbbellIcon,
                        col: "#EF4444",
                        v: protein,
                        s: setProtein,
                      },
                      {
                        Icon: WheatIcon,
                        col: "#F59E0B",
                        v: carbo,
                        s: setCarbo,
                      },
                      { Icon: DropletIcon, col: "#3B82F6", v: fat, s: setFat },
                    ].map(({ Icon, col, v, s }, idx) => (
                      <View key={idx} style={styles.macroItem}>
                        <Icon size={18} color={col} />
                        {isEditing ? (
                          <TextInput
                            value={v}
                            onChangeText={s}
                            keyboardType="numeric"
                            style={styles.inputFieldSmall}
                          />
                        ) : (
                          <Text style={styles.macroText}>
                            {parseFloat(v).toFixed(1)} g
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Details</Text>
                  <View style={styles.itemsContainer}>
                    {details.map((item, idx) => (
                      <View key={idx} style={styles.itemRowEdit}>
                        {isEditing ? (
                          <TextInput
                            value={item}
                            onChangeText={(t) => updateDetail(t, idx)}
                            style={styles.detailInput}
                          />
                        ) : (
                          <View style={styles.itemRow}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.itemText}>{item}</Text>
                          </View>
                        )}
                        {isEditing && (
                          <TouchableOpacity onPress={() => removeDetail(idx)}>
                            <TrashIcon size={20} color="#DC2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    {isEditing && (
                      <TouchableOpacity
                        onPress={addDetail}
                        style={styles.addDetailButton}
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
                            setDetails(
                              meal.items.split(",").map((d) => d.trim())
                            );
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
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        )}
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
  card: { maxHeight: "90%" },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 4,
  },
  image: {
    width: "100%",
    height: 240,
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  placeholder: { justifyContent: "center", alignItems: "center" },
  contentContainer: { padding: 16, flexGrow: 1 },
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
  caloriesRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  flameContainer: {
    padding: 8,
    borderRadius: 32,
    backgroundColor: "#ffedd4",
  },
  calTextWrapper: { marginLeft: 8 },
  calText1: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  calText2: { fontSize: 20, fontWeight: "600", color: "#000" },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
  },
  macroItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  macroText: { marginLeft: 6, fontSize: 14, color: "#374151" },
  inputField: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 80,
    textAlign: "center",
    fontSize: 16,
  },
  inputFieldSmall: {
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 60,
    textAlign: "center",
    fontSize: 14,
  },
  sectionLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  itemsContainer: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  itemRowEdit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemRow: { flexDirection: "row", alignItems: "center" },
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
  addDetailButton: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  addDetailText: { marginLeft: 6, fontSize: 14, color: "#2563EB" },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
