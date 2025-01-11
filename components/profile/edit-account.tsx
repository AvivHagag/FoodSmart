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
} from "react-native";
import { KeyRound, Pencil, Trash2 } from "lucide-react-native";
import AvatarImage from "./avatar";
import { BottomSpace } from "../bottom-space";
import Title from "../title";
import EditBasicInfo from "./edit-basic-info";
import ChangePassword from "./change-password";

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
  const [passwordOpen, setPasswordOpen] = useState<boolean>(false);

  const handleBackBottom = () => {
    setAccountEditProfile(false);
  };
  const handlePasswordOpen = () => {
    setPasswordOpen(!passwordOpen);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {!passwordOpen ? (
        <EditBasicInfo
          user={user}
          handlePasswordOpen={handlePasswordOpen}
          backBottom={handleBackBottom}
        />
      ) : (
        <ChangePassword
          userID={user._id}
          handlePasswordOpen={handlePasswordOpen}
        />
      )}
      <BottomSpace />
    </ScrollView>
  );
}
