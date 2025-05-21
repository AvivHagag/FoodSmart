import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { KeyRound, Pencil, Trash2, TriangleAlert, Images, Camera as CameraIcon, X } from "lucide-react-native";
import AvatarImage from "./avatar";
import Title from "../title";
import { useGlobalContext } from "@/app/context/authprovider";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "@/constants/constants";
import { Usertype } from "@/assets/types";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

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
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { logout, updateUser } = useGlobalContext();

  const handleSave = async () => {
    if (!fullname.trim()) {
      Alert.alert("Validation Error", "Full name is required.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Email is required.");
      return;
    }

    // Check if any changes were made
    if (fullname.trim() === user.fullname && 
        email.trim().toLowerCase() === user.email && 
        image === user.image) {
      backBottom();
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("userID", user._id);
      formData.append("fullname", fullname.trim());
      formData.append("email", email.trim().toLowerCase());
      
      if (image && image !== user.image && image.startsWith('file://')) {
        const filename = image.split('/').pop() || 'image.jpg';
        
        formData.append("image", {
          uri: image,
          type: 'image/jpeg',
          name: filename
        } as any);
      }
      
      const response = await fetch(`${BASE_URL}/api/update_basic_info`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (updateUser) {
          updateUser(result.user);
        }
        
        Alert.alert(
          "Success", 
          "Your personal information has been updated.",
          [
            {
              text: "OK",
              onPress: () => {
                backBottom()
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to update information.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImagePicker = () => {
    setIsImagePickerVisible(!isImagePickerVisible);
  };

  const handleChangePhoto = () => {
    toggleImagePicker();
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Camera permissions are needed to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
      
      toggleImagePicker();
    } catch (error) {
      console.error("Error with camera:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Gallery permissions are needed to select a photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
      
      toggleImagePicker();
    } catch (error) {
      console.error("Error with gallery:", error);
      Alert.alert("Error", "Failed to select photo");
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
  };

  const confirmDeleteAccount = async () => {
    try {
      console.log(user);
      const response = await fetch(`${BASE_URL}/api/delete_user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: user._id }),
      });

      if (response.ok) {
        setIsDeleteModalVisible(false);
        Alert.alert(
          "Account Deleted",
          "Your account has been successfully deleted.",
          [
            {
              text: "OK",
              onPress: async () => {
                await logout();
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete account.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-4">
      <Title text={"Edit Account"} backBottom={backBottom} />
      <View className="py-4">
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
                  style={styles.textInput}
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
                  style={styles.textInput}
                />
              </View>
              
              <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButtonContainer,
              ]}
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
            </View>
          </View>
          <View className="gap-3">
            <TouchableOpacity
              onPress={handlePasswordOpen}
              style={styles.button}
            >
              <KeyRound size={20} color="#6B7280" style={styles.icon} />
              <Text style={styles.text}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openDeleteModal}
              style={[styles.button, styles.deleteButton]}
            >
              <Trash2 size={20} color="#EF4444" style={styles.icon} />
              <Text style={[styles.text, styles.deleteText]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
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
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImagePickerVisible}
        onRequestClose={toggleImagePicker}
      >
        <View style={styles.modalBackdrop}>
          <View className="w-4/5 max-w-sm rounded-2xl bg-white shadow-md p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">Change Profile Photo</Text>
              <TouchableOpacity onPress={toggleImagePicker}>
                <X size={20} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              className="flex-row items-center gap-3 rounded-xl px-4 py-3 mb-2"
              onPress={openCamera}
            >
              <CameraIcon size={24} color={"black"} />
              <Text className="text-black text-center text-lg font-medium">
                Take Photo
              </Text>
            </TouchableOpacity>
            
            <View className="w-full h-[1px] bg-zinc-400 mb-2"></View>
            
            <TouchableOpacity
              className="flex-row items-center gap-3 rounded-xl px-4 py-3"
              onPress={openGallery}
            >
              <Images size={24} color={"black"} />
              <Text className="text-black text-center text-lg font-medium">
                Choose From Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  saveButtonContainer: {
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
  textInput: {
    marginTop: 2,
    backgroundColor: "#f3f4f6",
    height: 38,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#1F2937",
  },
});