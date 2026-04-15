import { authRequest, multipartRequest } from "@/api/client";
import type { MealDay, MealItem } from "@/api/types";

export type MealEntryInput = Omit<MealItem, "name">;

export async function getMealsByDate(date: string) {
  return authRequest<{ mealDay: MealDay | null }>("/api/v1/meals", {
    method: "GET",
    query: { date },
  });
}

export async function createMeal(date: string, entries: MealEntryInput[]) {
  return authRequest<MealDay>("/api/v1/meals", {
    method: "POST",
    body: { date, entries },
  });
}

export async function updateMeal(mealDayId: string, payload: {
  entryName: string;
  calories: number;
  protein: number;
  carbo: number;
  fat: number;
  items: string;
}) {
  return authRequest<MealDay>(`/api/v1/meals/${mealDayId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteMeal(mealDayId: string, entryName: string) {
  return authRequest<MealDay>(`/api/v1/meals/${mealDayId}`, {
    method: "DELETE",
    body: { entryName },
  });
}

export async function uploadMealImage(uri: string) {
  const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

  const formData = new FormData();
  formData.append(
    "image",
    {
      uri,
      name: `photo.${ext}`,
      type: mimeType,
    } as any,
  );

  return multipartRequest<{ url: string }>("/api/v1/meals/upload-image", formData, {
    method: "POST",
  });
}
