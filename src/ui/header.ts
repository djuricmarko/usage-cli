import { theme } from "./colors.js";
import type { PlanType } from "../types.js";
import { PLAN_LIMITS, getDaysUntilReset, getResetDate } from "../models/plan-limits.js";

export interface HeaderOptions {
  username: string;
  planType: PlanType;
  year: number;
  month: number;
}

export function renderHeader(options: HeaderOptions): string {
  const { username, planType, year, month } = options;
  const plan = PLAN_LIMITS[planType];

  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const daysUntilReset = getDaysUntilReset();
  const resetDate = getResetDate();
  const resetStr = resetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [""];

  // Title
  lines.push(`  ${theme.heading("GitHub Copilot Usage")}`);
  lines.push(`  ${"─".repeat(50)}`);

  // User and plan info
  lines.push(
    `  ${theme.primary("@" + username)}  ${theme.muted("│")}  ${theme.label("Plan:")} ${theme.accent(plan.displayName)} ${theme.muted("(" + plan.pricePerMonth + ")")}`
  );

  // Period
  let periodStr = `  ${theme.label("Period:")} ${theme.value(monthName + " " + year)}`;
  if (isCurrentMonth) {
    periodStr += `  ${theme.muted("│")}  ${theme.muted("Resets " + resetStr + " (" + daysUntilReset + " days)")}`;
  }
  lines.push(periodStr);

  lines.push("");

  return lines.join("\n");
}
