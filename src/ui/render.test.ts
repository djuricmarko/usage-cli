import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderJson } from "./render.js";
import type { RenderOptions } from "./render.js";
import {
  samplePremiumUsageResponse,
  emptyPremiumUsageResponse,
  highCostModelItem,
  standardModelItem,
  includedModelItem,
} from "../__fixtures__/premium-usage.js";

function makeOptions(overrides: Partial<RenderOptions> = {}): RenderOptions {
  return {
    username: "testuser",
    planType: "pro",
    year: 2025,
    month: 1,
    premiumUsage: samplePremiumUsageResponse,
    ...overrides,
  };
}

describe("render", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces non-empty string with all sections", () => {
    const output = render(makeOptions());
    // Header
    expect(output).toContain("GitHub Copilot Usage");
    expect(output).toContain("@testuser");
    // Progress bar
    expect(output).toContain("%");
    // Table
    expect(output).toContain("Claude Sonnet 4");
    // Has content
    expect(output.length).toBeGreaterThan(100);
  });

  it("shows remaining when under quota", () => {
    // samplePremiumUsageResponse total premium = 100 + 150 + 10 = 260
    // Pro plan limit = 300, so 40 remaining
    const output = render(makeOptions());
    expect(output).toContain("remaining");
  });

  it("shows overage warning when over quota", () => {
    // Create a response that exceeds 300 premium requests
    const overageUsage = {
      ...samplePremiumUsageResponse,
      usageItems: [
        {
          ...standardModelItem,
          grossQuantity: 200,
          discountQuantity: 200,
          netQuantity: 150,
          netAmount: 6.0,
        },
      ],
    };
    const output = render(makeOptions({ premiumUsage: overageUsage }));
    expect(output).toContain("Over quota");
  });

  it("shows included request footnote when included requests > 0", () => {
    // includedModelItem has grossQuantity: 150 but 0 premium
    const output = render(makeOptions());
    expect(output).toContain("included models");
  });

  it("shows reset date for current month", () => {
    const output = render(makeOptions());
    expect(output).toContain("Quota resets");
  });

  it("shows billed total when cost > 0", () => {
    const output = render(makeOptions());
    expect(output).toContain("$");
    expect(output).toContain("billed");
  });

  it("handles empty usage data", () => {
    const output = render(makeOptions({ premiumUsage: emptyPremiumUsageResponse }));
    expect(output).toContain("No usage data");
  });
});

describe("renderJson", () => {
  it("returns valid JSON", () => {
    const output = renderJson(makeOptions());
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("has correct top-level structure", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    expect(data).toHaveProperty("plan");
    expect(data).toHaveProperty("usage");
    expect(data).toHaveProperty("raw");
  });

  it("plan info matches input", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    expect(data.plan.type).toBe("pro");
    expect(data.plan.name).toBe("Copilot Pro");
    expect(data.plan.monthlyAllowance).toBe(300);
  });

  it("usage is computed correctly", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    // Total premium = 0 (included) + 100 (standard) + 150 (high) + 10 (low) = 260
    expect(data.usage.totalPremiumRequests).toBe(260);
    expect(data.usage.remaining).toBe(40); // 300 - 260
    expect(data.usage.percentUsed).toBeCloseTo(86.7, 0);
  });

  it("includes detection info when provided", () => {
    const data = JSON.parse(
      renderJson(makeOptions({ planDetected: true, planConfidence: "high" }))
    );
    expect(data.plan.detected).toBe(true);
    expect(data.plan.confidence).toBe("high");
  });

  it("excludes detection info when not provided", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    expect(data.plan).not.toHaveProperty("detected");
    expect(data.plan).not.toHaveProperty("confidence");
  });

  it("includes per-model breakdown", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    expect(Array.isArray(data.usage.models)).toBe(true);
    expect(data.usage.models.length).toBeGreaterThan(0);
  });

  it("includes raw API response", () => {
    const data = JSON.parse(renderJson(makeOptions()));
    expect(data.raw).toEqual(samplePremiumUsageResponse);
  });

  it("remaining is 0 when over quota", () => {
    const overageUsage = {
      ...samplePremiumUsageResponse,
      usageItems: [
        {
          ...standardModelItem,
          grossQuantity: 500,
          discountQuantity: 300,
          netQuantity: 200,
          netAmount: 8.0,
        },
      ],
    };
    const data = JSON.parse(renderJson(makeOptions({ premiumUsage: overageUsage })));
    expect(data.usage.remaining).toBe(0);
    expect(data.usage.totalPremiumRequests).toBe(500);
  });
});
