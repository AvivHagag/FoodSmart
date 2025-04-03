import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import RNPickerSelect from "react-native-picker-select";
import { BottomSpace } from "../bottom-space";
import Title from "../title";
import { BASE_URL } from "@/constants/constants";

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
  bmi?: string | null;
  tdee?: string | null;
}

interface EditPersonalInfoScreenProps {
  user: Usertype;
  setUserEditProfile: Dispatch<SetStateAction<boolean>>;
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
}: EditPersonalInfoScreenProps) {
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

  const [errors, setErrors] = useState<{
    age?: string;
    weight?: string;
    height?: string;
  }>({});

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

    const updatedUser: Usertype = {
      ...user,
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      gender,
      activityLevel,
      goal,
    };

    try {
      const response = await fetch(`${BASE_URL}/api/update_user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        Alert.alert(
          "Success",
          "Your personal information has been updated.",
          [
            {
              text: "OK",
              onPress: () => setUserEditProfile(false),
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update personal information.");
    }
  };

  const handleBackBottom = () => {
    setUserEditProfile(false);
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Image picker functionality not implemented.");
  };

  return (
    <ScrollView className="flex-1 bg-white px-4">
      <Title text={"Edit Personal Info"} backBottom={handleBackBottom} />

      <View className="gap-3">
        <View className="bg-white rounded-lg shadow p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Physical Information
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            Help us understand your physical attributes
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Age</Text>
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
              className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          <View className="flex-row justify-between">
            <View className="w-1/2 mr-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={(text) => {
                  setWeight(text);
                  if (errors.weight) {
                    setErrors((prev) => ({ ...prev, weight: undefined }));
                  }
                }}
                placeholder="Enter your weight"
                keyboardType="decimal-pad"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              />
              {errors.weight && (
                <Text style={styles.errorText}>{errors.weight}</Text>
              )}
            </View>

            <View className="w-1/2 ml-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={(text) => {
                  setHeight(text);
                  if (errors.height) {
                    setErrors((prev) => ({ ...prev, height: undefined }));
                  }
                }}
                placeholder="Enter your height"
                keyboardType="decimal-pad"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              />
              {errors.height && (
                <Text style={styles.errorText}>{errors.height}</Text>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Gender
            </Text>
            <View className="mt-1 border border-gray-300 rounded-lg bg-white">
              <RNPickerSelect
                onValueChange={(value) => setGender(value)}
                items={genderOptions}
                placeholder={{
                  label: "Select your gender",
                  value: undefined,
                  color: "#9ca3af",
                }}
                style={{
                  inputIOS: styles.picker,
                  inputAndroid: styles.picker,
                  iconContainer: styles.iconContainer,
                }}
                Icon={() => {
                  return <ChevronDown size={20} color="#6B7280" />;
                }}
                value={gender}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Activity Level
            </Text>
            <View className="mt-1 border border-gray-300 rounded-lg bg-white">
              <RNPickerSelect
                onValueChange={(value) => setActivityLevel(value)}
                items={activityLevelOptions}
                placeholder={{
                  label: "Select your activity level",
                  value: undefined,
                  color: "#9ca3af",
                }}
                style={{
                  inputIOS: styles.picker,
                  inputAndroid: styles.picker,
                  iconContainer: styles.iconContainer,
                }}
                Icon={() => {
                  return <ChevronDown size={20} color="#6B7280" />;
                }}
                value={activityLevel}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Goal</Text>
            <View className="mt-1 border border-gray-300 rounded-lg bg-white">
              <RNPickerSelect
                onValueChange={(value) => setGoal(value)}
                items={goalOptions}
                placeholder={{
                  label: "Select your goal",
                  value: undefined,
                  color: "#9ca3af",
                }}
                style={{
                  inputIOS: styles.picker,
                  inputAndroid: styles.picker,
                  iconContainer: styles.iconContainer,
                }}
                Icon={() => {
                  return <ChevronDown size={20} color="#6B7280" />;
                }}
                value={goal}
              />
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        className="mt-6 pb-12 bg-blue-500 rounded-lg p-4 items-center"
      >
        <Text className="text-white font-semibold">Save Changes</Text>
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
});

