import { authRequest } from "@/api/client";

export async function getDailyAdvice(date?: string) {
  return authRequest<{ advice: any; date: string }>("/api/v1/ai-advice/daily", {
    method: "POST",
    body: { date },
  });
}

export async function getWeeklySummary() {
  return authRequest<{ advice: any; weekly_data: Record<string, any> }>(
    "/api/v1/ai-advice/weekly-summary",
    {
      method: "GET",
    },
  );
}
