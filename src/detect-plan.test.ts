import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectPlan } from "./detect-plan.js";
import type { ApiClient } from "./api.js";
import { proUser, freeUser, userWithoutPlan, enterpriseUser } from "./__fixtures__/github-user.js";
import {
  proPlusBillingSummary,
  proBillingSummary,
  emptyBillingSummary,
  noCopilotBillingSummary,
} from "./__fixtures__/usage-summary.js";

function createMockClient(overrides: {
  userResponse?: unknown;
  userError?: Error;
  summaryResponse?: unknown;
  summaryError?: Error;
}): ApiClient {
  const getFn = vi.fn().mockImplementation((path: string) => {
    if (path === "/user") {
      if (overrides.userError) return Promise.reject(overrides.userError);
      return Promise.resolve(overrides.userResponse ?? proUser);
    }
    if (path.includes("/billing/usage/summary")) {
      if (overrides.summaryError) return Promise.reject(overrides.summaryError);
      return Promise.resolve(overrides.summaryResponse ?? emptyBillingSummary);
    }
    return Promise.resolve({});
  });

  return { get: getFn } as unknown as ApiClient;
}

describe("detectPlan", () => {
  it("returns low confidence default when user fetch fails", async () => {
    const client = createMockClient({
      userError: new Error("network error"),
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("low");
  });

  it("detects pro-plus when totalDiscount > 300", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryResponse: proPlusBillingSummary,
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("pro-plus");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("exceeds Pro limit");
  });

  it("detects pro when totalDiscount > 50 and <= 300", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryResponse: proBillingSummary,
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("exceeds Free limit");
  });

  it("falls back to free when GitHub plan is free and no billing signal", async () => {
    const client = createMockClient({
      userResponse: freeUser,
      summaryResponse: emptyBillingSummary,
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("free");
    expect(result.confidence).toBe("medium");
  });

  it("falls back to pro when GitHub plan is pro and no billing signal", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryResponse: emptyBillingSummary,
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("medium");
  });

  it("falls back to pro with low confidence for unknown plan", async () => {
    const client = createMockClient({
      userResponse: enterpriseUser,
      summaryResponse: emptyBillingSummary,
    });
    const result = await detectPlan(client);

    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("low");
  });

  it("handles billing summary fetch failure gracefully", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryError: new Error("billing unavailable"),
    });
    const result = await detectPlan(client);

    // Falls through to GitHub plan heuristic
    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("medium");
  });

  it("handles empty usageItems array", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryResponse: { usageItems: [] },
    });
    const result = await detectPlan(client);

    // Falls through to heuristic
    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("medium");
  });

  it("filters only copilot-related billing items", async () => {
    const client = createMockClient({
      userResponse: proUser,
      summaryResponse: noCopilotBillingSummary,
    });
    const result = await detectPlan(client);

    // Non-copilot items should be ignored, falls through to heuristic
    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("medium");
  });

  it("handles user without plan field", async () => {
    const client = createMockClient({
      userResponse: userWithoutPlan,
      summaryResponse: emptyBillingSummary,
    });
    const result = await detectPlan(client);

    // plan.name is undefined -> unknown -> defaults to pro, low confidence
    expect(result.planType).toBe("pro");
    expect(result.confidence).toBe("low");
  });
});
