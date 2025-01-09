import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { ChevronLeft, Pencil } from "lucide-react-native";
import AvatarImage from "./avatar";
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

interface EditAccountProps {
  user: Usertype;
  setAccountEditProfile: Dispatch<SetStateAction<boolean>>;
}

export default function EditAccount({
  user,
  setAccountEditProfile,
}: EditAccountProps) {
  const [fullname, setFullname] = useState<string>(user.fullname);
  const [email, setEmail] = useState<string>(user.email);
  const [image, setImage] = useState<string | null>(
    user.image ? user.image : null
  );

  const handleSave = () => {
    if (!fullname.trim()) {
      Alert.alert("Validation Error", "Full name is required.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Email is required.");
      return;
    }

    const updatedUser: Usertype = {
      ...user,
      fullname: fullname.trim(),
      email: email.trim().toLowerCase(),
      image,
      // Optionally, recalculate BMI and TDEE here or on the backend
    };

    // TODO: Implement the updateUser logic, e.g., API call to update user data

    // Provide feedback to the user
    Alert.alert("Success", "Your personal information has been updated.", [
      {
        text: "OK",
        onPress: () => setAccountEditProfile(false),
      },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Image picker functionality not implemented.");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-6">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => setAccountEditProfile(false)}>
          <ChevronLeft size={24} color="#4B5563" />
        </TouchableOpacity>
        {/* <Title text={"Edit Account"} /> */}
        <Text className="text-2xl font-semibold text-gray-900">
          Edit Account
        </Text>
        <View />
      </View>

      <View className="items-center mb-6 relative">
        {image ? (
          <Image
            source={{ uri: image }}
            className="rounded-full"
            style={{ width: 100, height: 100 }}
          />
        ) : (
          <AvatarImage name={fullname} size={100} />
        )}
        <TouchableOpacity
          onPress={handleChangePhoto}
          className="absolute bg-gray-400 rounded-full p-2 shadow"
          style={{
            backgroundColor: "#9ca3af",
            opacity: 0.9,
            paddingHorizontal: 8,
            paddingVertical: 2,
            bottom: 0,
            right: "32%",
            transform: [{ translateX: 0 }, { translateY: 0 }],
          }}
        >
          <View className="flex-row justify-center items-center">
            <Pencil size={16} color="#FFFFFF" />
            <Text className="text-white ml-1">Edit</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="gap-3">
        <View className="space-y-6">
          <View className="bg-white rounded-lg shadow p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Basic Information
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Please provide your personal details
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Full Name
              </Text>
              <TextInput
                value={fullname}
                onChangeText={setFullname}
                placeholder="Enter your full name"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              />
            </View>
          </View>
        </View>
      </View>
      <BottomSpace />
    </ScrollView>
  );
}
