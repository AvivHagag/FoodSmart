import React, { useState } from "react";
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
import { KeyRound, Eye, EyeOff } from "lucide-react-native";
import Title from "../title";

interface ChangePasswordProps {
  userID: string;
  handlePasswordOpen: () => void;
}

export default function ChangePassword({
  userID,
  handlePasswordOpen,
}: ChangePasswordProps) {
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Validation Error", "Current password is required.");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert("Validation Error", "New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // On success
      Alert.alert("Success", "Your password has been updated.", [
        { text: "OK", onPress: handlePasswordOpen },
      ]);

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // On error
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Title text={"Change Password"} backBottom={handlePasswordOpen} />

      <View className="mx-auto">
        <View className="mb-6">
          <View
            className="flex-row items-center justify-center p-3 border rounded-lg"
            style={{
              backgroundColor: "#fef9c3",
              borderColor: "#fde047",
            }}
          >
            <KeyRound size={24} color="#F59E0B" />
            <View className="ml-1">
              <Text className="text-yellow-600 font-semibold">
                Security First
              </Text>
              <Text className="text-yellow-700">
                Choose a strong password that you haven't used before.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-lg p-3 shadow-md shadow-zinc-300 mb-8">
        <View className="flex flex-row items-center">
          <Text className="text-2xl font-semibold text-gray-900 mr-2">
            Change Your Password
          </Text>
          <Text
            className="mb-2"
            style={{
              fontSize: 28,
            }}
          >
            🔐
          </Text>
        </View>
        <Text className="text-gray-500 mb-4">
          Please enter your current password and choose a new one
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Current Password
          </Text>
          <View className="relative">
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              accessibilityLabel="Current Password"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.absolutePosition}
              accessibilityLabel={
                showCurrentPassword
                  ? "Hide current password"
                  : "Show current password"
              }
              accessibilityRole="button"
            >
              {showCurrentPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            New Password
          </Text>
          <View className="relative">
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              accessibilityLabel="New Password"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.absolutePosition}
              accessibilityLabel={
                showNewPassword ? "Hide new password" : "Show new password"
              }
              accessibilityRole="button"
            >
              {showNewPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </Text>
          <View className="relative">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              accessibilityLabel="Confirm New Password"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.absolutePosition}
              accessibilityLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              accessibilityRole="button"
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="w-full bg-blue-500 rounded-lg p-4 items-center"
          disabled={isLoading}
          style={isLoading ? styles.Clicked : styles.NotClicked}
          accessibilityLabel="Update Password"
          accessibilityRole="button"
        >
          {isLoading ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : (
            <View className="flex-row items-center">
              <KeyRound size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-1">
                Update Password
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  absolutePosition: {
    position: "absolute",
    right: 12, // 3 * 4 (React Native uses pixel values)
    top: 12, // 3 * 4
  },
  Clicked: {
    opacity: 0.5,
  },
  NotClicked: {
    opacity: 1,
  },
});
