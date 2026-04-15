import { authRequest, request } from "@/api/client";

export interface SupportMessagePayload {
  name: string;
  email: string;
  phone?: string | null;
  inquiryType: string;
  priority?: string;
  subject: string;
  message: string;
}

export async function submitSupportMessage(payload: SupportMessagePayload) {
  return request<{ message: string; ticketId: string }>("/api/v1/support/messages", {
    method: "POST",
    body: payload,
  });
}

export async function getSupportStats() {
  return authRequest("/api/v1/support/stats", { method: "GET" });
}
