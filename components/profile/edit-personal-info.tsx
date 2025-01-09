import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import RNPickerSelect from "react-native-picker-select";
import { BottomSpace } from "../bottom-space";
import Title from "../title";

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

  const handleSave = () => {
    // if (!fullname.trim()) {
    //   Alert.alert("Validation Error", "Full name is required.");
    //   return;
    // }
    // if (!email.trim()) {
    //   Alert.alert("Validation Error", "Email is required.");
    //   return;
    // }

    const updatedUser: Usertype = {
      ...user,
      age: age ? parseInt(age) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      gender,
      activityLevel,
      goal,
      // Optionally, recalculate BMI and TDEE here or on the backend
    };

    // TODO: Implement the updateUser logic, e.g., API call to update user data

    // Provide feedback to the user
    Alert.alert("Success", "Your personal information has been updated.", [
      {
        text: "OK",
        onPress: () => setUserEditProfile(false),
      },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Image picker functionality not implemented.");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => setUserEditProfile(false)}>
          <ChevronLeft size={24} color="#4B5563" />
        </TouchableOpacity>
        {/* <Title text={"Edit Personal Info"} /> */}
        <Text className="text-2xl font-semibold text-gray-900">
          Edit Personal Info
        </Text>
        <View />
      </View>

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
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="number-pad"
              className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
            />
          </View>

          <View className="flex-row justify-between">
            <View className="w-1/2 mr-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="Enter your weight"
                keyboardType="decimal-pad"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              />
            </View>

            <View className="w-1/2 ml-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="Enter your height"
                keyboardType="decimal-pad"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              />
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
});
