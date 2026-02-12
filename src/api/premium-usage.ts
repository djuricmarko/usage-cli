import type { ApiClient } from "../api.js";
import type { PremiumUsageResponse } from "../types.js";

export interface PremiumUsageOptions {
  username: string;
  year?: number;
  month?: number;
  day?: number;
  model?: string;
  product?: string;
}

export async function getPremiumRequestUsage(
  client: ApiClient,
  options: PremiumUsageOptions
): Promise<PremiumUsageResponse> {
  const params: Record<string, string | number> = {};

  if (options.year) params.year = options.year;
  if (options.month) params.month = options.month;
  if (options.day) params.day = options.day;
  if (options.model) params.model = options.model;
  if (options.product) params.product = options.product;

  return client.get<PremiumUsageResponse>(
    `/users/${options.username}/settings/billing/premium_request/usage`,
    params
  );
}
