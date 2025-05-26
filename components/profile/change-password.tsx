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
    <ScrollView style={styles.scrollContainer}>
      <Title text="Change Password" backBottom={handlePasswordOpen} />

      <View style={styles.container}>
        <View style={styles.marginBottom6}>
          <View
            style={[
              styles.alertContainer,
              {
                backgroundColor: "#fef9c3",
                paddingHorizontal: 12,
                borderColor: "#fde047",
              },
            ]}
          >
            <KeyRound size={24} color="#F59E0B" />
            <View style={styles.marginLeft1}>
              <Text style={styles.alertTitle}>Security First</Text>
              <Text style={styles.alertText}>
                Choose a strong password that you haven't used before.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: 16,
          shadowColor: "#71717a",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.7,
          shadowRadius: 4,
          elevation: 5,
          marginBottom: 32,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "500",
              color: "#111827",
            }}
          >
            Change Your Password
          </Text>
          <Text style={{ fontSize: 28, marginLeft: 4, marginBottom: 2 }}>
            🔐
          </Text>
        </View>
        <Text style={{ color: "#9ca3af", marginBottom: 16 }}>
          Please enter your current password and choose a new one
        </Text>

        <View style={styles.formField}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errors.currentPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    currentPassword: undefined,
                  }));
                }
              }}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
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

        <View style={styles.formField}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
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
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
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

        <View style={styles.formField}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
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
          disabled={isLoading}
          style={[
            styles.updateButton,
            isLoading ? styles.clicked : styles.notClicked,
            { padding: 10 },
          ]}
        >
          {isLoading ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : (
            <View style={styles.rowCenter}>
              <KeyRound size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Update Password</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  container: {
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  marginBottom6: {
    marginBottom: 24,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  marginLeft1: {
    marginLeft: 4,
  },
  alertTitle: {
    color: "#000",
    fontWeight: "600",
  },
  alertText: {
    color: "#a16207",
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  inputContainer: {
    position: "relative",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateButton: {
    width: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  eyeIconPosition: {
    position: "absolute",
    padding: 12,
    top: 0,
    right: 0,
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
  textInput: {
    marginTop: 2,
    height: 38,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#000",
  },
});
