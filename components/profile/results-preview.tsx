import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import {
  Calculator,
  Info,
  TrendingUp,
  Flame,
  X,
  Edit,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

type ResultsPreviewProps = {
  goal?: string | null | undefined;
  bmi?: string | number | null | undefined;
  tdee?: string | number | null | undefined;
  onEditData?: () => void;
  handleMissingData: () => void;
};

const ResultsPreview = ({
  goal,
  bmi: propBmi,
  tdee: propTdee,
  onEditData,
  handleMissingData,
}: ResultsPreviewProps) => {
  const [calculatedBmi, setCalculatedBmi] = useState(0);
  const [calculatedTdee, setCalculatedTdee] = useState(0);
  const [bmiCategory, setBmiCategory] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [dataComplete, setDataComplete] = useState(false);

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBMICategoryColor = (category: string): string => {
    switch (category) {
      case "Underweight":
        return "#f59e0b";
      case "Normal weight":
        return "#10b981";
      case "Overweight":
        return "#f97316";
      case "Obese":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getBMIRange = (bmi: number): number => {
    if (bmi <= 15) return 0;
    if (bmi >= 35) return 100;
    return ((bmi - 15) / 20) * 100;
  };

  useEffect(() => {
    const hasBmi = propBmi !== undefined && propBmi !== null && propBmi !== 0;
    const hasTdee =
      propTdee !== undefined && propTdee !== null && propTdee !== 0;
    setDataComplete(hasBmi && hasTdee);

    if (hasBmi) {
      const bmiValue =
        typeof propBmi === "string" ? parseFloat(propBmi) : (propBmi as number);
      setCalculatedBmi(bmiValue);
      setBmiCategory(getBMICategory(bmiValue));
    }

    if (hasTdee) {
      const tdeeValue =
        typeof propTdee === "string"
          ? parseFloat(propTdee)
          : (propTdee as number);
      setCalculatedTdee(tdeeValue);
    }
  }, [propBmi, propTdee]);

  const bmiColor = getBMICategoryColor(bmiCategory);
  const displayBmi = calculatedBmi;
  const displayTdee = Math.round(calculatedTdee);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.iconContainer}>
          <Calculator size={20} color="#fff" />
        </View>
        <Text style={styles.headerText}>Your Results</Text>
      </View>
      <TouchableOpacity
        onPress={() => setTooltipVisible(true)}
        style={styles.infoButton}
      >
        <Info size={20} color="#111827" />
      </TouchableOpacity>
      <Modal
        transparent={true}
        animationType="fade"
        visible={tooltipVisible}
        onRequestClose={() => setTooltipVisible(false)}
      >
        <View style={styles.tooltipModal}>
          <View style={styles.tooltipContent}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>
                Understanding Your Results
              </Text>
              <TouchableOpacity
                onPress={() => setTooltipVisible(false)}
                style={styles.closeIconButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tooltipScrollView}>
              <View style={styles.explanationSection}>
                <View style={styles.explanationHeader}>
                  <TrendingUp size={16} color="#374151" />
                  <Text style={styles.explanationTitle}>
                    Body Mass Index (BMI)
                  </Text>
                </View>
                <Text style={styles.explanationText}>
                  BMI is a measure of body fat based on height and weight. It
                  helps categorize weight status:
                </Text>
                <View style={styles.categoryExplanation}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: "#f59e0b" }]}
                  />
                  <Text style={styles.categoryExplanationText}>
                    <Text style={styles.categoryBold}>Underweight:</Text> BMI
                    less than 18.5
                  </Text>
                </View>
                <View style={styles.categoryExplanation}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: "#10b981" }]}
                  />
                  <Text style={styles.categoryExplanationText}>
                    <Text style={styles.categoryBold}>Normal weight:</Text> BMI
                    between 18.5 and 24.9
                  </Text>
                </View>
                <View style={styles.categoryExplanation}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: "#f97316" }]}
                  />
                  <Text style={styles.categoryExplanationText}>
                    <Text style={styles.categoryBold}>Overweight:</Text> BMI
                    between 25 and 29.9
                  </Text>
                </View>
                <View style={styles.categoryExplanation}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: "#ef4444" }]}
                  />
                  <Text style={styles.categoryExplanationText}>
                    <Text style={styles.categoryBold}>Obese:</Text> BMI of 30 or
                    higher
                  </Text>
                </View>
              </View>

              <View style={styles.explanationSection}>
                <View style={styles.explanationHeader}>
                  <Flame size={16} color="#f97316" />
                  <Text style={styles.explanationTitle}>
                    Daily Energy Expenditure
                  </Text>
                </View>
                <Text style={styles.explanationText}>
                  This shows how many calories your body needs each day based
                  on:
                </Text>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Your Basal Metabolic Rate (BMR): Energy needed at complete
                    rest
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Activity level: How active you are during the day
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Goal adjustment: Modified based on whether you want to lose,
                    maintain, or gain weight
                  </Text>
                </View>

                <View style={styles.macroExplanation}>
                  <Text style={styles.explanationSubtitle}>
                    Macronutrient Breakdown
                  </Text>
                  <Text style={styles.explanationText}>
                    Macronutrients are divided into approximate recommended
                    daily amounts:
                  </Text>
                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Protein: 30% of calories (4 calories per gram)
                    </Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Carbs: 40% of calories (4 calories per gram)
                    </Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Fat: 30% of calories (9 calories per gram)
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.disclaimerSection}>
                <Info size={16} color="#6B7280" />
                <Text style={styles.disclaimerText}>
                  These calculations are estimates based on standard formulas
                  and may vary based on individual factors. Consult with a
                  healthcare provider for personalized guidance.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setTooltipVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderMissingDataView = () => (
    <View>
      {renderHeader()}
      <View style={styles.missingDataContainer}>
        <View style={styles.iconCircle}>
          <Calculator size={24} color="#000000" />
        </View>
        <Text style={styles.missingDataTitle}>Complete Your Profile</Text>
        <Text style={styles.missingDataText}>
          We need more information to calculate your BMI and daily calorie
          needs. Complete your profile to get personalized nutrition insights.
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleMissingData()}
        >
          <LinearGradient
            colors={["#0EA5E9", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}
          >
            <View style={styles.buttonContent}>
              <Edit size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Complete Profile</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!dataComplete) {
    return renderMissingDataView();
  }

  return (
    <View>
      {renderHeader()}

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <TrendingUp size={20} color="#374151" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Body Mass Index (BMI)</Text>
          </View>
          <Text style={[styles.valueText, { color: bmiColor }]}>
            {displayBmi.toFixed(1)}
          </Text>
        </View>

        <View style={styles.bmiScaleContainer}>
          <View style={styles.bmiBarBackground}>
            <View
              style={[
                styles.bmiBarFill,
                {
                  width: `${getBMIRange(displayBmi)}%`,
                  backgroundColor: bmiColor,
                },
              ]}
            />
          </View>
          <View style={styles.bmiLabelsContainer}>
            <Text style={styles.labelText}>Underweight</Text>
            <Text style={styles.labelText}>Normal</Text>
            <Text style={styles.labelText}>Overweight</Text>
            <Text style={styles.labelText}>Obese</Text>
          </View>
        </View>

        <View style={styles.categoryRow}>
          <View style={[styles.categoryDot, { backgroundColor: bmiColor }]} />
          <Text style={[styles.categoryText, { color: bmiColor }]}>
            {bmiCategory}
          </Text>
        </View>
      </View>

      <View style={[styles.sectionContainer, { marginBottom: 0 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Flame size={20} color="#f97316" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>
              Daily Energy Expenditure
            </Text>
          </View>
          <Text style={styles.valueText}>{displayTdee}</Text>
        </View>

        <View style={styles.tdeeInfo}>
          <View>
            <Text style={styles.infoText}>Recommended daily intake</Text>
            <Text style={styles.subInfoText}>Based on your {goal} goal</Text>
          </View>
          <View style={styles.calorieBadgeContainer}>
            <Text style={styles.calorieBadgeText}>calories/day</Text>
          </View>
        </View>

        <View style={styles.macroSection}>
          <Text style={styles.macroHeader}>
            Estimated Macronutrient Breakdown
          </Text>
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroText}>Protein</Text>
              <Text style={styles.macroValue}>
                {Math.round((displayTdee * 0.3) / 4)}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroText}>Carbs</Text>
              <Text style={styles.macroValue}>
                {Math.round((displayTdee * 0.4) / 4)}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroText}>Fat</Text>
              <Text style={styles.macroValue}>
                {Math.round((displayTdee * 0.3) / 9)}g
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ResultsPreview;
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#111827",
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  infoButton: {
    padding: 8,
  },
  sectionContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  valueText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f97316",
  },
  bmiScaleContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  bmiBarBackground: {
    height: 4,
    width: "100%",
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  bmiBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  bmiLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  labelText: {
    fontSize: 10,
    color: "#6B7280",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tdeeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
  },
  subInfoText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  calorieBadgeContainer: {
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calorieBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  macroSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingTop: 16,
  },
  macroHeader: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  macroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  macroText: {
    fontSize: 12,
    color: "#6B7280",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginTop: 4,
  },
  tooltipModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  tooltipContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 16,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeIconButton: {
    padding: 4,
  },
  tooltipScrollView: {
    maxHeight: "90%",
  },
  explanationSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 20,
  },
  explanationSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
    marginTop: 16,
  },
  categoryExplanation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryExplanationText: {
    fontSize: 14,
    color: "#374151",
  },
  categoryBold: {
    fontWeight: "500",
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6B7280",
    marginRight: 8,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  macroExplanation: {
    marginTop: 8,
  },
  disclaimerSection: {
    padding: 16,
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: "#111827",
    padding: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  missingDataContainer: {
    alignItems: "center",
    padding: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  missingDataTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  missingDataText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  editButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  gradientBackground: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
