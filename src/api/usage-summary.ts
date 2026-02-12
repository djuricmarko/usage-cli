import type { ApiClient } from "../api.js";
import type { UsageSummaryResponse } from "../types.js";

export interface UsageSummaryOptions {
  username: string;
  year?: number;
  month?: number;
  day?: number;
  product?: string;
  sku?: string;
}

export async function getUsageSummary(
  client: ApiClient,
  options: UsageSummaryOptions
): Promise<UsageSummaryResponse> {
  const params: Record<string, string | number> = {};

  if (options.year) params.year = options.year;
  if (options.month) params.month = options.month;
  if (options.day) params.day = options.day;
  if (options.product) params.product = options.product;
  if (options.sku) params.sku = options.sku;

  return client.get<UsageSummaryResponse>(
    `/users/${options.username}/settings/billing/usage/summary`,
    params
  );
}
