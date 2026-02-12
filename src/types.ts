// GitHub API response types

export interface TimePeriod {
  year: number;
  month?: number;
  day?: number;
}

export interface PremiumUsageItem {
  product: string;
  sku: string;
  model: string;
  unitType: string;
  pricePerUnit: number;
  grossQuantity: number;
  grossAmount: number;
  discountQuantity: number;
  discountAmount: number;
  netQuantity: number;
  netAmount: number;
}

export interface PremiumUsageResponse {
  timePeriod: TimePeriod;
  user?: string;
  organization?: string;
  usageItems: PremiumUsageItem[];
}

export interface UsageItem {
  date: string;
  product: string;
  sku: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  repositoryName?: string;
  organizationName?: string;
}

export interface UsageReportResponse {
  usageItems: UsageItem[];
}

export interface UsageSummaryItem {
  product: string;
  sku: string;
  unitType: string;
  pricePerUnit: number;
  grossQuantity: number;
  grossAmount: number;
  discountQuantity: number;
  discountAmount: number;
  netQuantity: number;
  netAmount: number;
}

export interface UsageSummaryResponse {
  timePeriod: TimePeriod;
  user?: string;
  organization?: string;
  usageItems: UsageSummaryItem[];
}

export interface GitHubUser {
  login: string;
  name: string | null;
  email: string | null;
  plan?: {
    name: string;
    space: number;
    collaborators: number;
    private_repos: number;
  };
}

export interface AuthInfo {
  token: string;
  username: string;
}

export type PlanType = "free" | "pro" | "pro-plus" | "business" | "enterprise";

export interface PlanInfo {
  name: string;
  displayName: string;
  monthlyPremiumRequests: number;
  pricePerMonth: string;
  includedModels: string[];
}

export interface ModelInfo {
  name: string;
  displayName: string;
  paidMultiplier: number;
  freeMultiplier: number | null;
  category: "included" | "low" | "standard" | "high" | "ultra";
}
