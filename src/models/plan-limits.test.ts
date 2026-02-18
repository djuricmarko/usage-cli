import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PLAN_LIMITS,
  MODEL_MULTIPLIERS,
  getModelMultiplier,
  isIncludedModel,
  getResetDate,
  getDaysUntilReset,
} from "./plan-limits.js";
import type { PlanType } from "../types.js";

describe("PLAN_LIMITS", () => {
  it("contains all 5 plan types", () => {
    const plans: PlanType[] = ["free", "pro", "pro-plus", "business", "enterprise"];
    for (const plan of plans) {
      expect(PLAN_LIMITS[plan]).toBeDefined();
    }
  });

  it("has correct monthly premium request allowances", () => {
    expect(PLAN_LIMITS.free.monthlyPremiumRequests).toBe(50);
    expect(PLAN_LIMITS.pro.monthlyPremiumRequests).toBe(300);
    expect(PLAN_LIMITS["pro-plus"].monthlyPremiumRequests).toBe(1500);
    expect(PLAN_LIMITS.business.monthlyPremiumRequests).toBe(300);
    expect(PLAN_LIMITS.enterprise.monthlyPremiumRequests).toBe(1000);
  });

  it("has required fields for each plan", () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("displayName");
      expect(plan).toHaveProperty("monthlyPremiumRequests");
      expect(plan).toHaveProperty("pricePerMonth");
      expect(plan).toHaveProperty("includedModels");
      expect(Array.isArray(plan.includedModels)).toBe(true);
    }
  });
});

describe("MODEL_MULTIPLIERS", () => {
  it("contains 24 models", () => {
    expect(MODEL_MULTIPLIERS).toHaveLength(24);
  });

  it("each model has required fields", () => {
    for (const model of MODEL_MULTIPLIERS) {
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("displayName");
      expect(model).toHaveProperty("paidMultiplier");
      expect(typeof model.paidMultiplier).toBe("number");
      expect(model).toHaveProperty("category");
      expect(["included", "low", "standard", "high", "ultra"]).toContain(model.category);
    }
  });

  it("included models have paidMultiplier of 0", () => {
    const included = MODEL_MULTIPLIERS.filter((m) => m.category === "included");
    expect(included.length).toBeGreaterThan(0);
    for (const m of included) {
      expect(m.paidMultiplier).toBe(0);
    }
  });
});

describe("getModelMultiplier", () => {
  it("returns paidMultiplier for known model on paid plan", () => {
    expect(getModelMultiplier("Claude Sonnet 4", "pro")).toBe(1);
  });

  it("returns 0 for included model on paid plan", () => {
    expect(getModelMultiplier("GPT-4o", "pro")).toBe(0);
  });

  it("returns freeMultiplier for model on free plan", () => {
    expect(getModelMultiplier("GPT-4o", "free")).toBe(1);
  });

  it("returns 1 for unknown model (default)", () => {
    expect(getModelMultiplier("Unknown-Model-XYZ", "pro")).toBe(1);
  });

  it("is case insensitive", () => {
    expect(getModelMultiplier("gpt-4o", "pro")).toBe(0);
    expect(getModelMultiplier("GPT-4O", "pro")).toBe(0);
  });

  it("returns 1 when freeMultiplier is null on free plan", () => {
    // Claude Sonnet 4 has freeMultiplier: null
    expect(getModelMultiplier("Claude Sonnet 4", "free")).toBe(1);
  });

  it("returns correct multiplier for high-cost models", () => {
    expect(getModelMultiplier("Claude Opus 4.5", "pro")).toBe(3);
  });

  it("returns correct multiplier for ultra-cost models", () => {
    expect(getModelMultiplier("Claude Opus 4.6 (fast)", "pro")).toBe(9);
    expect(getModelMultiplier("Claude Opus 4.1", "pro")).toBe(10);
  });

  it("returns correct multiplier for low-cost models", () => {
    expect(getModelMultiplier("Claude Haiku 4.5", "pro")).toBe(0.33);
    expect(getModelMultiplier("Grok Code Fast 1", "pro")).toBe(0.25);
  });
});

describe("isIncludedModel", () => {
  it("returns true for included model on paid plan", () => {
    expect(isIncludedModel("GPT-4o", "pro")).toBe(true);
    expect(isIncludedModel("GPT-4.1", "pro")).toBe(true);
    expect(isIncludedModel("GPT-5 mini", "pro")).toBe(true);
    expect(isIncludedModel("Raptor mini", "pro")).toBe(true);
  });

  it("returns false for non-included model", () => {
    expect(isIncludedModel("Claude Opus 4.5", "pro")).toBe(false);
    expect(isIncludedModel("Claude Sonnet 4", "pro")).toBe(false);
  });

  it("returns false for any model on free plan", () => {
    expect(isIncludedModel("GPT-4o", "free")).toBe(false);
    expect(isIncludedModel("GPT-4.1", "free")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isIncludedModel("gpt-4o", "pro-plus")).toBe(true);
    expect(isIncludedModel("raptor mini", "business")).toBe(true);
  });

  it("works for all paid plan types", () => {
    const paidPlans: PlanType[] = ["pro", "pro-plus", "business", "enterprise"];
    for (const plan of paidPlans) {
      expect(isIncludedModel("GPT-4o", plan)).toBe(true);
    }
  });
});

describe("getResetDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns first of next month in UTC", () => {
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    const reset = getResetDate();
    expect(reset.getUTCFullYear()).toBe(2025);
    expect(reset.getUTCMonth()).toBe(1); // February
    expect(reset.getUTCDate()).toBe(1);
  });

  it("rolls over to next year in December", () => {
    vi.setSystemTime(new Date("2025-12-20T12:00:00Z"));
    const reset = getResetDate();
    expect(reset.getUTCFullYear()).toBe(2026);
    expect(reset.getUTCMonth()).toBe(0); // January
    expect(reset.getUTCDate()).toBe(1);
  });
});

describe("getDaysUntilReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct days from mid-month", () => {
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
    const days = getDaysUntilReset();
    expect(days).toBe(17); // Jan 15 -> Feb 1 = 17 days
  });

  it("returns 1 on last day of month", () => {
    vi.setSystemTime(new Date("2025-01-31T00:00:00Z"));
    const days = getDaysUntilReset();
    expect(days).toBe(1);
  });

  it("returns days remaining on first day of month", () => {
    vi.setSystemTime(new Date("2025-02-01T00:00:00Z"));
    const days = getDaysUntilReset();
    // Feb 1 -> Mar 1 = 28 days
    expect(days).toBe(28);
  });
});
