import { describe, it, expect } from "vitest";
import { buildModelRows, renderModelTable } from "./table.js";
import type { PremiumUsageItem } from "../types.js";
import {
  includedModelItem,
  standardModelItem,
  highCostModelItem,
  lowCostModelItem,
} from "../__fixtures__/premium-usage.js";

describe("buildModelRows", () => {
  it("computes premiumRequests as discountQuantity + netQuantity", () => {
    const rows = buildModelRows([standardModelItem], "pro");
    expect(rows[0].premiumRequests).toBe(
      standardModelItem.discountQuantity + standardModelItem.netQuantity
    );
  });

  it("identifies included models (premiumRequests = 0, grossQuantity > 0)", () => {
    const rows = buildModelRows([includedModelItem], "pro");
    expect(rows[0].isIncluded).toBe(true);
    expect(rows[0].premiumRequests).toBe(0);
  });

  it("sets multiplier to 0 for included models", () => {
    const rows = buildModelRows([includedModelItem], "pro");
    expect(rows[0].multiplier).toBe(0);
  });

  it("derives multiplier from API data (premiumRequests / grossQuantity)", () => {
    const rows = buildModelRows([highCostModelItem], "pro");
    // 150 premium / 50 gross = 3
    expect(rows[0].multiplier).toBe(
      (highCostModelItem.discountQuantity + highCostModelItem.netQuantity) /
        highCostModelItem.grossQuantity
    );
  });

  it("falls back to hardcoded multiplier when grossQuantity is 0", () => {
    const item: PremiumUsageItem = {
      ...standardModelItem,
      model: "Claude Sonnet 4",
      grossQuantity: 0,
      discountQuantity: 0,
      netQuantity: 0,
    };
    const rows = buildModelRows([item], "pro");
    // getModelMultiplier("Claude Sonnet 4", "pro") = 1
    expect(rows[0].multiplier).toBe(1);
  });

  it("sorts by premiumRequests descending", () => {
    const rows = buildModelRows(
      [lowCostModelItem, highCostModelItem, standardModelItem],
      "pro"
    );
    expect(rows[0].premiumRequests).toBeGreaterThanOrEqual(rows[1].premiumRequests);
    expect(rows[1].premiumRequests).toBeGreaterThanOrEqual(rows[2].premiumRequests);
  });

  it("secondary sort by requests when premiumRequests tied", () => {
    const itemA: PremiumUsageItem = {
      ...standardModelItem,
      model: "ModelA",
      grossQuantity: 200,
      discountQuantity: 50,
      netQuantity: 0,
    };
    const itemB: PremiumUsageItem = {
      ...standardModelItem,
      model: "ModelB",
      grossQuantity: 100,
      discountQuantity: 50,
      netQuantity: 0,
    };
    const rows = buildModelRows([itemB, itemA], "pro");
    // Same premiumRequests (50), but itemA has more gross requests
    expect(rows[0].model).toBe("ModelA");
    expect(rows[1].model).toBe("ModelB");
  });

  it("filters items: product = Copilot or grossQuantity > 0", () => {
    const nonCopilotZero: PremiumUsageItem = {
      ...standardModelItem,
      product: "Actions",
      grossQuantity: 0,
      discountQuantity: 0,
      netQuantity: 0,
    };
    const rows = buildModelRows(
      [standardModelItem, nonCopilotZero],
      "pro"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].model).toBe(standardModelItem.model);
  });

  it("cost comes from netAmount", () => {
    const rows = buildModelRows([highCostModelItem], "pro");
    expect(rows[0].cost).toBe(highCostModelItem.netAmount);
  });

  it("handles empty input", () => {
    const rows = buildModelRows([], "pro");
    expect(rows).toEqual([]);
  });
});

describe("renderModelTable", () => {
  it("returns 'No usage data' message for empty rows", () => {
    const output = renderModelTable([]);
    expect(output).toContain("No usage data");
  });

  it("renders table with model data", () => {
    const rows = buildModelRows(
      [standardModelItem, highCostModelItem],
      "pro"
    );
    const output = renderModelTable(rows);
    // Should contain model names somewhere in the output
    expect(output).toContain("Claude Sonnet 4");
    expect(output).toContain("Claude Opus 4.5");
    // Should contain "Total" row
    expect(output).toContain("Total");
  });

  it("totals row sums correctly", () => {
    const rows = buildModelRows(
      [standardModelItem, highCostModelItem, lowCostModelItem],
      "pro"
    );
    const output = renderModelTable(rows);

    const totalRequests =
      standardModelItem.grossQuantity +
      highCostModelItem.grossQuantity +
      lowCostModelItem.grossQuantity;
    // The total requests number (180) should appear in the output
    expect(output).toContain(totalRequests.toLocaleString());
  });
});
