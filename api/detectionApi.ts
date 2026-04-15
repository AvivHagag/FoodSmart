import { multipartRequest } from "@/api/client";
import type { AnalyzedFoodItem } from "@/api/types";

export async function analyzeMealImage(uri: string) {
  const formData = new FormData();
  formData.append(
    "image",
    {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any,
  );

  return multipartRequest<AnalyzedFoodItem[]>("/api/v1/detection/analyze", formData, {
    method: "POST",
  });
}
