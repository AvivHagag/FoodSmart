export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5002";

// On a real device, localhost is the phone itself — use your Mac's LAN IP in .env.
if (__DEV__) {
  console.log("[FoodSmart] API:", BASE_URL);
}
