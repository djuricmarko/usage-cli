import type { PlanInfo, PlanType, ModelInfo } from "../types.js";

export const PLAN_LIMITS: Record<PlanType, PlanInfo> = {
  free: {
    name: "free",
    displayName: "Copilot Free",
    monthlyPremiumRequests: 50,
    pricePerMonth: "$0",
    includedModels: [],
  },
  pro: {
    name: "pro",
    displayName: "Copilot Pro",
    monthlyPremiumRequests: 300,
    pricePerMonth: "$10",
    includedModels: ["GPT-4o", "GPT-4.1", "GPT-5 mini", "Raptor mini"],
  },
  "pro-plus": {
    name: "pro-plus",
    displayName: "Copilot Pro+",
    monthlyPremiumRequests: 1500,
    pricePerMonth: "$39",
    includedModels: ["GPT-4o", "GPT-4.1", "GPT-5 mini", "Raptor mini"],
  },
  business: {
    name: "business",
    displayName: "Copilot Business",
    monthlyPremiumRequests: 300,
    pricePerMonth: "$19/seat",
    includedModels: ["GPT-4o", "GPT-4.1", "GPT-5 mini", "Raptor mini"],
  },
  enterprise: {
    name: "enterprise",
    displayName: "Copilot Enterprise",
    monthlyPremiumRequests: 1000,
    pricePerMonth: "$39/seat",
    includedModels: ["GPT-4o", "GPT-4.1", "GPT-5 mini", "Raptor mini"],
  },
};

export const MODEL_MULTIPLIERS: ModelInfo[] = [
  // Included models (0x on paid plans)
  { name: "GPT-5 mini", displayName: "GPT-5 mini", paidMultiplier: 0, freeMultiplier: 1, category: "included" },
  { name: "GPT-4.1", displayName: "GPT-4.1", paidMultiplier: 0, freeMultiplier: 1, category: "included" },
  { name: "GPT-4o", displayName: "GPT-4o", paidMultiplier: 0, freeMultiplier: 1, category: "included" },
  { name: "Raptor mini", displayName: "Raptor mini", paidMultiplier: 0, freeMultiplier: 1, category: "included" },

  // Low-cost models (0.25x - 0.33x)
  { name: "Claude Haiku 4.5", displayName: "Claude Haiku 4.5", paidMultiplier: 0.33, freeMultiplier: 1, category: "low" },
  { name: "Gemini 3 Flash", displayName: "Gemini 3 Flash", paidMultiplier: 0.33, freeMultiplier: null, category: "low" },
  { name: "GPT-5.1-Codex-Mini", displayName: "GPT-5.1-Codex-Mini", paidMultiplier: 0.33, freeMultiplier: null, category: "low" },
  { name: "Grok Code Fast 1", displayName: "Grok Code Fast 1", paidMultiplier: 0.25, freeMultiplier: null, category: "low" },

  // Standard models (1x)
  { name: "Claude Sonnet 4", displayName: "Claude Sonnet 4", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "Claude Sonnet 4.5", displayName: "Claude Sonnet 4.5", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "Gemini 2.5 Pro", displayName: "Gemini 2.5 Pro", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "Gemini 3 Pro", displayName: "Gemini 3 Pro", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5", displayName: "GPT-5", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5-Codex", displayName: "GPT-5-Codex", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.1", displayName: "GPT-5.1", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.1-Codex", displayName: "GPT-5.1-Codex", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.1-Codex-Max", displayName: "GPT-5.1-Codex-Max", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.2", displayName: "GPT-5.2", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.2-Codex", displayName: "GPT-5.2-Codex", paidMultiplier: 1, freeMultiplier: null, category: "standard" },
  { name: "GPT-5.3-Codex", displayName: "GPT-5.3-Codex", paidMultiplier: 1, freeMultiplier: null, category: "standard" },

  // High-cost models (3x)
  { name: "Claude Opus 4.5", displayName: "Claude Opus 4.5", paidMultiplier: 3, freeMultiplier: null, category: "high" },
  { name: "Claude Opus 4.6", displayName: "Claude Opus 4.6", paidMultiplier: 3, freeMultiplier: null, category: "high" },

  // Ultra-cost models (9x+)
  { name: "Claude Opus 4.6 (fast)", displayName: "Claude Opus 4.6 (fast)", paidMultiplier: 9, freeMultiplier: null, category: "ultra" },
  { name: "Claude Opus 4.1", displayName: "Claude Opus 4.1", paidMultiplier: 10, freeMultiplier: null, category: "ultra" },
];

export function getModelMultiplier(modelName: string, planType: PlanType): number {
  const model = MODEL_MULTIPLIERS.find(
    (m) => m.name.toLowerCase() === modelName.toLowerCase()
  );
  if (!model) return 1; // Default to 1x for unknown models
  return planType === "free" ? (model.freeMultiplier ?? 1) : model.paidMultiplier;
}

export function isIncludedModel(modelName: string, planType: PlanType): boolean {
  if (planType === "free") return false;
  const plan = PLAN_LIMITS[planType];
  return plan.includedModels.some(
    (m) => m.toLowerCase() === modelName.toLowerCase()
  );
}

export function getResetDate(): Date {
  const now = new Date();
  const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return resetDate;
}

export function getDaysUntilReset(): number {
  const now = new Date();
  const reset = getResetDate();
  const diff = reset.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
