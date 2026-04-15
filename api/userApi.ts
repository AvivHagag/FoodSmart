import { authRequest, multipartRequest } from "@/api/client";
import type { User } from "@/api/types";

export interface ProfilePayload {
  age: number;
  weight: number;
  height: number;
  gender: string;
  activityLevel: string;
  goal: string;
  bmi: number;
  tdee: number;
}

export async function getCurrentUser() {
  return authRequest<User>("/api/v1/users/me");
}

export async function updateProfile(payload: ProfilePayload) {
  return authRequest<User>("/api/v1/users/me/profile", {
    method: "PATCH",
    body: payload,
  });
}

export async function updateBasicInfo(fullname: string, email: string, imageUri?: string | null) {
  const formData = new FormData();
  formData.append("fullname", fullname.trim());
  formData.append("email", email.trim().toLowerCase());

  if (imageUri && imageUri.startsWith("file://")) {
    const filename = imageUri.split("/").pop() || "image.jpg";
    formData.append(
      "image",
      {
        uri: imageUri,
        type: "image/jpeg",
        name: filename,
      } as any,
    );
  }

  return multipartRequest<User>("/api/v1/users/me/basic-info", formData, {
    method: "PATCH",
  });
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  return authRequest<{ message: string }>("/api/v1/users/me/password", {
    method: "PATCH",
    body: { currentPassword, newPassword },
  });
}

export async function deleteCurrentUser() {
  return authRequest<{ message: string }>("/api/v1/users/me", {
    method: "DELETE",
  });
}
