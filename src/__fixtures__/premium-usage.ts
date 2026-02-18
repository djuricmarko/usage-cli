import type { PremiumUsageResponse, PremiumUsageItem } from "../types.js";

/**
 * A single included-model usage item (GPT-4o on a paid plan: 0x multiplier).
 * grossQuantity > 0 but discountQuantity + netQuantity = 0.
 */
export const includedModelItem: PremiumUsageItem = {
  product: "Copilot",
  sku: "premium_requests",
  model: "GPT-4o",
  unitType: "premium_request",
  pricePerUnit: 0.04,
  grossQuantity: 150,
  grossAmount: 0,
  discountQuantity: 0,
  discountAmount: 0,
  netQuantity: 0,
  netAmount: 0,
};

/**
 * A standard 1x model usage item (Claude Sonnet 4).
 * 100 requests * 1x multiplier = 100 premium requests, all within allowance.
 */
export const standardModelItem: PremiumUsageItem = {
  product: "Copilot",
  sku: "premium_requests",
  model: "Claude Sonnet 4",
  unitType: "premium_request",
  pricePerUnit: 0.04,
  grossQuantity: 100,
  grossAmount: 4.0,
  discountQuantity: 100,
  discountAmount: 4.0,
  netQuantity: 0,
  netAmount: 0,
};

/**
 * A high-cost 3x model with some overage (Claude Opus 4.5).
 * 50 requests * 3x = 150 premium requests. 100 discounted, 50 billed.
 */
export const highCostModelItem: PremiumUsageItem = {
  product: "Copilot",
  sku: "premium_requests",
  model: "Claude Opus 4.5",
  unitType: "premium_request",
  pricePerUnit: 0.04,
  grossQuantity: 50,
  grossAmount: 6.0,
  discountQuantity: 100,
  discountAmount: 4.0,
  netQuantity: 50,
  netAmount: 2.0,
};

/**
 * A low-cost model (Claude Haiku 4.5, 0.33x).
 * 30 requests * 0.33 ~= 10 premium requests, all discounted.
 */
export const lowCostModelItem: PremiumUsageItem = {
  product: "Copilot",
  sku: "premium_requests",
  model: "Claude Haiku 4.5",
  unitType: "premium_request",
  pricePerUnit: 0.04,
  grossQuantity: 30,
  grossAmount: 0.4,
  discountQuantity: 10,
  discountAmount: 0.4,
  netQuantity: 0,
  netAmount: 0,
};

/**
 * A complete premium usage response with a mix of model types.
 */
export const samplePremiumUsageResponse: PremiumUsageResponse = {
  timePeriod: { year: 2025, month: 1 },
  user: "testuser",
  usageItems: [
    includedModelItem,
    standardModelItem,
    highCostModelItem,
    lowCostModelItem,
  ],
};

/**
 * An empty usage response (no data for the period).
 */
export const emptyPremiumUsageResponse: PremiumUsageResponse = {
  timePeriod: { year: 2025, month: 1 },
  user: "testuser",
  usageItems: [],
};
