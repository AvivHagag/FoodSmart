import React, { Dispatch, SetStateAction, useState } from "react";
import { ScrollView } from "react-native";
import { BottomSpace } from "../bottom-space";
import EditBasicInfo from "./edit-basic-info";
import ChangePassword from "./change-password";
import { Usertype } from "@/assets/types";

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
