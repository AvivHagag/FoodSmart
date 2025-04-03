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
import { BASE_URL } from "@/constants/constants";

interface ChangePasswordProps {
  userID: string;
  handlePasswordOpen: () => void;
}

export default function ChangePassword({
  userID,
  handlePasswordOpen,
}: ChangePasswordProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{7,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      setErrors({ currentPassword: "Current password is required." });
      return;
    }
    if (!newPassword.trim()) {
      setErrors({ newPassword: "New password is required." });
      return;
    }
    if (!isValidPassword(newPassword)) {
      setErrors({
        newPassword:
          "Password must be at least 7 characters long and include both letters and numbers.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setErrors({});

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/update_password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userID,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Your password has been updated.", [
          { text: "OK", onPress: handlePasswordOpen },
        ]);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Title text="Change Password" backBottom={handlePasswordOpen} />

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
          <Text style={{ fontSize: 28 }}>🔐</Text>
        </View>
        <Text className="text-gray-500 mb-4">
          Please enter your current password and choose a new one
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1" >
            Current Password
          </Text>
          <View className="relative">
            <TextInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errors.currentPassword) {
                  setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }
              }}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIconPosition}
            >
              {showCurrentPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          {errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1">
            New Password
          </Text>
          <View className="relative">
            <TextInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }
              }}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIconPosition}
            >
              {showNewPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1" >
            Confirm New Password
          </Text>
          <View className="relative">
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIconPosition}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="w-full bg-blue-500 rounded-lg p-4 items-center"
          disabled={isLoading}
          style={isLoading ? styles.clicked : styles.notClicked}
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
  eyeIconPosition: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  clicked: {
    opacity: 0.5,
  },
  notClicked: {
    opacity: 1,
  },
  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 12,
  },
});
