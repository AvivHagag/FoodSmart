import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "@/constants/constants";

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null;
  query?: Record<string, QueryValue>;
  token?: string | null;
}

export class APIError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

let unauthorizedHandler: (() => Promise<void> | void) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => "");
  return text || null;
}

function extractErrorMessage(payload: any, status: number) {
  if (payload && typeof payload === "object") {
    return payload.detail || payload.error || payload.message || `Request failed (${status})`;
  }
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  return `Request failed (${status})`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});
  let finalBody: BodyInit | undefined;

  if (body != null && !isFormDataBody(body) && typeof body !== "string") {
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
    finalBody = JSON.stringify(body);
  } else if (body != null) {
    finalBody = body as BodyInit;
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: requestHeaders,
    body: finalBody,
  });

  const payload = await parseResponse(response);

  if (response.status === 401 && unauthorizedHandler) {
    await unauthorizedHandler();
  }

  if (!response.ok) {
    const code =
      payload && typeof payload === "object" && "code" in payload
        ? String((payload as { code?: unknown }).code || "")
        : undefined;
    throw new APIError(extractErrorMessage(payload, response.status), response.status, code, payload);
  }

  return payload as T;
}

export async function authRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("token");
  return request<T>(path, { ...options, token });
}

export async function multipartRequest<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, "body"> = {},
): Promise<T> {
  return authRequest<T>(path, { ...options, body: formData });
}
