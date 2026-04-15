import { authRequest } from "@/api/client";
import type { StatisticsResponse } from "@/api/types";

export async function getStatistics(range: string) {
  return authRequest<StatisticsResponse>("/api/v1/statistics", {
    method: "GET",
    query: { range },
  });
}
