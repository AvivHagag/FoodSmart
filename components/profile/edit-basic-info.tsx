import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { KeyRound, Pencil, Trash2, TriangleAlert } from "lucide-react-native";
import AvatarImage from "./avatar";
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

interface EditBasicInfoProps {
  user: Usertype;
  handlePasswordOpen: () => void;
  backBottom: () => void;
}

export default function EditBasicInfo({
  user,
  handlePasswordOpen,
  backBottom,
}: EditBasicInfoProps) {
  const [fullname, setFullname] = useState<string>(user.fullname);
  const [email, setEmail] = useState<string>(user.email);
  const [image, setImage] = useState<string | null>(
    user.image ? user.image : null
  );
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

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
        // onPress: () => setAccountEditProfile(false),
      },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Image picker functionality not implemented.");
  };

  const openDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
  };

  const confirmDeleteAccount = () => {
    // TODO: Implement account deletion logic here
    Alert.alert(
      "Account Deleted",
      "Your account has been successfully deleted.",
      [
        {
          text: "OK",
          onPress: () => {
            setIsDeleteModalVisible(false);
            // Navigate the user to the login screen or another appropriate screen
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Title text={"Edit Account"} backBottom={backBottom} />
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
        <View className="gap-3">
          <TouchableOpacity onPress={handlePasswordOpen} style={styles.button}>
            <KeyRound size={20} color="#6B7280" style={styles.icon} />
            <Text style={styles.text}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openDeleteModal}
            style={[styles.button, styles.deleteButton]}
          >
            <Trash2 size={20} color="#EF4444" style={styles.icon} />
            <Text style={[styles.text, styles.deleteText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <View className="bg-white rounded-lg w-11/12 md:w-1/2 p-6">
            <Text className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </Text>
            <Text className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Text>
            <View className="flex-row justify-start gap-3">
              <TouchableOpacity
                onPress={closeDeleteModal}
                style={styles.button}
                accessibilityLabel="Cancel Deletion"
                accessibilityRole="button"
              >
                <Text className="text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteAccount}
                style={styles.DeleteButton}
                accessibilityLabel="Confirm Deletion"
                accessibilityRole="button"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-md text-white">Delete</Text>
                  <TriangleAlert width={28} color={"white"} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  DeleteButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  deleteButton: {
    borderColor: "#EF4444",
  },
  deleteText: {
    color: "#EF4444",
  },
});
