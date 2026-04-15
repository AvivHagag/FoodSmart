import { request } from "@/api/client";
import type { User } from "@/api/types";

export async function registerUser(email: string, fullname: string, password: string) {
  return request<{ message: string }>("/api/v1/auth/register", {
    method: "POST",
    body: { email, fullname, password },
  });
}

export async function loginUser(email: string, password: string) {
  return request<{ token: string; user: User }>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}
