import { theme, getUsageColor } from "./colors.js";
import { renderHeader } from "./header.js";
import { renderProgressBar } from "./progress-bar.js";
import { renderModelTable, buildModelRows } from "./table.js";
import type { PremiumUsageResponse, PlanType } from "../types.js";
import { PLAN_LIMITS, getDaysUntilReset, getResetDate } from "../models/plan-limits.js";

export interface RenderOptions {
  username: string;
  planType: PlanType;
  year: number;
  month: number;
  premiumUsage: PremiumUsageResponse;
}

export function render(options: RenderOptions): string {
  const { username, planType, year, month, premiumUsage } = options;
  const plan = PLAN_LIMITS[planType];

  const lines: string[] = [];

  // Header
  lines.push(renderHeader({ username, planType, year, month }));

  // Build model rows
  const modelRows = buildModelRows(premiumUsage.usageItems, planType);
  const totalPremiumRequests = modelRows.reduce((sum, r) => sum + r.premiumRequests, 0);
  const totalCost = modelRows.reduce((sum, r) => sum + r.cost, 0);
  const includedRequests = modelRows
    .filter((r) => r.isIncluded)
    .reduce((sum, r) => sum + r.requests, 0);

  // Progress bar
  lines.push(
    renderProgressBar({
      current: totalPremiumRequests,
      total: plan.monthlyPremiumRequests,
      width: 50,
      label: "Premium Requests",
      showPercentage: true,
      showCount: true,
    })
  );
  lines.push("");

  // Cost summary
  if (totalPremiumRequests > plan.monthlyPremiumRequests) {
    const overageRequests = totalPremiumRequests - plan.monthlyPremiumRequests;
    const overageCost = overageRequests * 0.04;
    lines.push(
      `  ${theme.error("⚠ Over quota by " + overageRequests.toLocaleString() + " requests")}  ${theme.muted("│")}  ${theme.error("Est. overage: $" + overageCost.toFixed(2))}`
    );
  } else {
    const remaining = plan.monthlyPremiumRequests - totalPremiumRequests;
    lines.push(
      `  ${theme.success(remaining.toLocaleString() + " premium requests remaining")}  ${theme.muted("│")}  ${theme.muted("Overage cost: $0.00")}`
    );
  }

  lines.push("");

  // Model breakdown table
  lines.push(`  ${theme.heading("Model Breakdown")}`);
  lines.push(renderModelTable(modelRows));

  // Footer notes
  lines.push("");
  if (includedRequests > 0) {
    lines.push(
      `  ${theme.muted("*")} ${theme.dim(includedRequests.toLocaleString() + " requests used included models (not counted toward premium quota)")}`
    );
  }

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  if (isCurrentMonth) {
    const resetDate = getResetDate();
    const resetStr = resetDate.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
    lines.push(`  ${theme.muted("*")} ${theme.dim("Quota resets: " + resetStr)}`);
  }

  if (totalCost > 0) {
    lines.push(
      `  ${theme.muted("*")} ${theme.dim("Total billed: $" + totalCost.toFixed(2) + " @ $0.04/premium request")}`
    );
  }

  lines.push("");

  return lines.join("\n");
}

export function renderJson(options: RenderOptions): string {
  const { planType, premiumUsage } = options;
  const plan = PLAN_LIMITS[planType];
  const modelRows = buildModelRows(premiumUsage.usageItems, planType);
  const totalPremiumRequests = modelRows.reduce((sum, r) => sum + r.premiumRequests, 0);

  return JSON.stringify(
    {
      plan: {
        type: planType,
        name: plan.displayName,
        monthlyAllowance: plan.monthlyPremiumRequests,
      },
      usage: {
        totalPremiumRequests,
        remaining: Math.max(0, plan.monthlyPremiumRequests - totalPremiumRequests),
        percentUsed: plan.monthlyPremiumRequests > 0
          ? Number(((totalPremiumRequests / plan.monthlyPremiumRequests) * 100).toFixed(1))
          : 0,
        models: modelRows,
      },
      raw: premiumUsage,
    },
    null,
    2
  );
}
