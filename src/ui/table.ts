import Table from "cli-table3";
import { theme, getMultiplierColor } from "./colors.js";
import type { PremiumUsageItem, PlanType } from "../types.js";
import { getModelMultiplier } from "../models/plan-limits.js";

export interface ModelRow {
  model: string;
  requests: number;
  premiumRequests: number;
  multiplier: number;
  isIncluded: boolean;
  cost: number;
}

export function buildModelRows(
  usageItems: PremiumUsageItem[],
  planType: PlanType
): ModelRow[] {
  return usageItems
    .filter((item) => item.product === "Copilot" || item.grossQuantity > 0)
    .map((item) => {
      // Use the API-provided netQuantity as the premium request count.
      // This matches what GitHub shows on their billing page, rather than
      // recomputing from grossQuantity * hardcoded multiplier which can drift.
      const premiumRequests = item.netQuantity;
      const isIncluded = item.grossQuantity > 0 && premiumRequests === 0 && item.netAmount === 0;

      // Derive the effective multiplier from API data when possible,
      // fall back to the hardcoded lookup for display purposes.
      let multiplier: number;
      if (isIncluded) {
        multiplier = 0;
      } else if (item.grossQuantity > 0) {
        multiplier = premiumRequests / item.grossQuantity;
      } else {
        multiplier = getModelMultiplier(item.model, planType);
      }

      return {
        model: item.model,
        requests: item.grossQuantity,
        premiumRequests,
        multiplier,
        isIncluded,
        cost: item.netAmount,
      };
    })
    .sort((a, b) => b.premiumRequests - a.premiumRequests || b.requests - a.requests);
}

export function renderModelTable(rows: ModelRow[]): string {
  if (rows.length === 0) {
    return `\n  ${theme.muted("No usage data found for this period.")}\n`;
  }

  const table = new Table({
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
    style: {
      head: [],
      border: [],
      "padding-left": 1,
      "padding-right": 1,
    },
    head: [
      theme.heading("Model"),
      theme.heading("Requests"),
      theme.heading("Multiplier"),
      theme.heading("Premium Reqs"),
      theme.heading("Cost"),
    ],
    colAligns: ["left", "right", "right", "right", "right"],
  });

  for (const row of rows) {
    const multiplierColor = getMultiplierColor(row.multiplier);
    // Format multiplier to avoid long floating-point decimals
    const multiplierVal = Number.isInteger(row.multiplier)
      ? `${row.multiplier}x`
      : `${parseFloat(row.multiplier.toFixed(2))}x`;
    const multiplierStr = row.isIncluded
      ? theme.included("0x (incl)")
      : multiplierColor(multiplierVal);

    table.push([
      theme.label(row.model),
      theme.value(row.requests.toLocaleString()),
      multiplierStr,
      row.isIncluded
        ? theme.muted("—")
        : theme.value(row.premiumRequests.toLocaleString()),
      row.cost > 0 ? theme.warning("$" + row.cost.toFixed(2)) : theme.muted("$0.00"),
    ]);
  }

  // Total row
  const totalRequests = rows.reduce((sum, r) => sum + r.requests, 0);
  const totalPremium = rows.reduce((sum, r) => sum + r.premiumRequests, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);

  table.push([
    theme.heading("Total"),
    theme.heading(totalRequests.toLocaleString()),
    "",
    theme.heading(totalPremium.toLocaleString()),
    totalCost > 0
      ? theme.warning("$" + totalCost.toFixed(2))
      : theme.muted("$" + totalCost.toFixed(2)),
  ]);

  // Indent the table
  return table
    .toString()
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
}
