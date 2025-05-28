import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { BottomSpace } from "../bottom-space";
import {
  ChevronDown,
  Calendar as CalendarIcon,
  Scale as ScaleIcon,
  Ruler as RulerIcon,
  User as UserIcon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  HeartHandshake,
} from "lucide-react-native";
import { BASE_URL } from "@/constants/constants";
import Title from "../title";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalContext } from "@/app/context/authprovider";

interface Usertype {
  _id: string;
  email: string;
  fullname: string;
  createdAt?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  image?: string | null;
  gender?: string | null;
  activityLevel?: string | null;
  goal?: string | null;
  bmi?: number | null;
  tdee?: number | null;
}

interface EditPersonalInfoScreenProps {
  user: Usertype;
  setUserEditProfile: Dispatch<SetStateAction<boolean>>;
  updateUser: (updatedUser: Usertype) => Promise<void>;
  required?: boolean;
}

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const activityLevelOptions = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Lightly Active", value: "lightly active" },
  { label: "Moderately Active", value: "moderately active" },
  { label: "Very Active", value: "very active" },
  { label: "Extra Active", value: "extra active" },
];

const goalOptions = [
  { label: "Maintain", value: "maintain" },
  { label: "Lose", value: "lose" },
  { label: "Gain", value: "gain" },
];

export default function EditPersonalInfoScreen({
  user,
  setUserEditProfile,
  updateUser,
  required,
}: EditPersonalInfoScreenProps) {
  const { logout } = useGlobalContext();
  const [age, setAge] = useState<string>(user.age ? user.age.toString() : "");
  const [weight, setWeight] = useState<string>(
    user.weight ? user.weight.toString() : ""
  );
  const [height, setHeight] = useState<string>(
    user.height ? user.height.toString() : ""
  );
  const [gender, setGender] = useState<string | null>(user.gender || "male");
  const [activityLevel, setActivityLevel] = useState<string | null>(
    user.activityLevel || "sedentary"
  );
  const [goal, setGoal] = useState<string | null>(user.goal || "maintain");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<{
    age?: string;
    weight?: string;
    height?: string;
  }>({});

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const calculateTDEE = (
    weight: number,
    height: number,
    age: number,
    gender: string | null,
    activityLevel: string | null,
    goal: string | null
  ) => {
    let bmr: number;
    if (gender === "female") {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    }
    const activityFactors: { [key: string]: number } = {
      sedentary: 1.2,
      "lightly active": 1.375,
      "moderately active": 1.55,
      "very active": 1.725,
      "extra active": 1.9,
    };
    const factor = activityLevel
      ? activityFactors[activityLevel.toLowerCase()] || 1.2
      : 1.2;
    let tdee = bmr * factor;
    if (goal === "lose") {
      tdee -= 500;
    } else if (goal === "gain") {
      tdee += 500;
    }
    return Math.round(tdee);
  };

  const handleSave = async () => {
    if (!age.trim()) {
      setErrors({ age: "Age is required." });
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setErrors({ age: "Please enter a valid age." });
      return;
    }
    if (parsedAge < 13 || parsedAge > 120) {
      setErrors({ age: "Age must be between 13 and 120." });
      return;
    }

    if (!weight.trim()) {
      setErrors({ weight: "Weight is required." });
      return;
    }
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrors({ weight: "Please enter a valid weight." });
      return;
    }
    if (parsedWeight < 30 || parsedWeight > 300) {
      setErrors({ weight: "Weight must be between 30kg and 300kg." });
      return;
    }

    if (!height.trim()) {
      setErrors({ height: "Height is required." });
      return;
    }
    const parsedHeight = parseFloat(height);
    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      setErrors({ height: "Please enter a valid height." });
      return;
    }
    if (parsedHeight < 100 || parsedHeight > 250) {
      setErrors({ height: "Height must be between 100cm and 250cm." });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const bmi = calculateBMI(parsedWeight, parsedHeight);
    const tdee = calculateTDEE(
      parsedWeight,
      parsedHeight,
      parsedAge,
      gender,
      activityLevel,
      goal
    );

    const updatedUser: Usertype = {
      ...user,
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      gender,
      activityLevel,
      goal,
      bmi,
      tdee,
    };

    try {
      const response = await fetch(`${BASE_URL}/api/update_user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });
      setIsLoading(false);
      if (response.ok) {
        await updateUser(updatedUser);
        setUserEditProfile(false);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Failed to update personal information.");
    }
  };

  const handleBackBottom = () => {
    if (required) {
      logout();
    } else {
      setUserEditProfile(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-4">
      {required ? (
        <Title
          text="Add Personal Info"
          backBottom={handleBackBottom}
          logoutFunction={true}
        />
      ) : (
        <Title
          text="Edit Personal Info"
          backBottom={handleBackBottom}
          logoutFunction={false}
        />
      )}
      <View className="items-center py-4">
        <View className="bg-gray-900 w-12 h-12 rounded-full items-center justify-center mb-2">
          <View
            style={[
              styles.circleBlackBackground,
              { borderRadius: 999, padding: 8 },
            ]}
          >
            <HeartHandshake size={36} color="#ffffff" />
          </View>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Physical Profile
        </Text>
        <Text className="text-gray-600 text-center">
          Help us personalize your experience
        </Text>
      </View>

      <View className="bg-white rounded-lg shadow p-4">
        <View className="mb-4">
          <View className="flex-row items-center mb-2" style={styles.spaceX}>
            <CalendarIcon size={18} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-700">Age</Text>
          </View>
          <TextInput
            value={age}
            onChangeText={(text) => {
              setAge(text);
              if (errors.age) {
                setErrors((prev) => ({ ...prev, age: undefined }));
              }
            }}
            placeholder="Enter your age"
            keyboardType="number-pad"
            style={styles.textInput}
          />
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        <View
          className="flex-row justify-between w-full"
          style={styles.rowContainer}
        >
          <View style={styles.halfWidthInput}>
            <View className="flex-row items-center mb-2" style={styles.spaceX}>
              <ScaleIcon size={18} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700">
                Weight (kg)
              </Text>
            </View>
            <TextInput
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                if (errors.weight) {
                  setErrors((prev) => ({ ...prev, weight: undefined }));
                }
              }}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
              style={styles.textInput}
            />
            {errors.weight && (
              <Text style={styles.errorText}>{errors.weight}</Text>
            )}
          </View>

          <View style={styles.halfWidthInput}>
            <View className="flex-row items-center mb-2" style={styles.spaceX}>
              <RulerIcon size={18} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700">
                Height (cm)
              </Text>
            </View>
            <TextInput
              value={height}
              onChangeText={(text) => {
                setHeight(text);
                if (errors.height) {
                  setErrors((prev) => ({ ...prev, height: undefined }));
                }
              }}
              placeholder="Enter height"
              keyboardType="decimal-pad"
              style={styles.textInput}
            />
            {errors.height && (
              <Text style={styles.errorText}>{errors.height}</Text>
            )}
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center mb-2" style={styles.spaceX}>
            <UserIcon size={18} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-700">Gender</Text>
          </View>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setGender(value)}
              items={genderOptions}
              placeholder={{
                label: "Select your gender",
                value: undefined,
                color: "#9ca3af",
              }}
              style={{
                inputIOS: { ...styles.picker, height: 48 },
                inputAndroid: { ...styles.picker, height: 48 },
                iconContainer: { ...styles.iconContainer, top: 14 },
              }}
              Icon={() => <ChevronDown size={20} color="#6B7280" />}
              value={gender}
            />
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center mb-2" style={styles.spaceX}>
            <ActivityIcon size={18} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-700">
              Activity Level
            </Text>
          </View>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setActivityLevel(value)}
              items={activityLevelOptions}
              placeholder={{
                label: "Select your activity level",
                value: undefined,
                color: "#9ca3af",
              }}
              style={{
                inputIOS: { ...styles.picker, height: 48 },
                inputAndroid: { ...styles.picker, height: 48 },
                iconContainer: { ...styles.iconContainer, top: 14 },
              }}
              Icon={() => <ChevronDown size={20} color="#6B7280" />}
              value={activityLevel}
            />
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center mb-2" style={styles.spaceX}>
            <TargetIcon size={18} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-700">Goal</Text>
          </View>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setGoal(value)}
              items={goalOptions}
              placeholder={{
                label: "Select your goal",
                value: undefined,
                color: "#9ca3af",
              }}
              style={{
                inputIOS: { ...styles.picker, height: 48 },
                inputAndroid: { ...styles.picker, height: 48 },
                iconContainer: { ...styles.iconContainer, top: 14 },
              }}
              Icon={() => <ChevronDown size={20} color="#6B7280" />}
              value={goal}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[
          styles.saveButtonContainer,
          isLoading && styles.saveButtonDisabled,
        ]}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["#27272A", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <BottomSpace />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  picker: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#1F2937",
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 12,
  },
  circleBlackBackground: {
    backgroundColor: "#000000",
    borderRadius: 999,
  },
  spaceX: {
    gap: 4,
  },
  pickerContainer: {
    backgroundColor: "#f3f4f6",
    height: 38,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    justifyContent: "center",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  halfWidthInput: {
    width: "48%",
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: "#f3f4f6",
    height: 38,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  gradientBackground: {
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
