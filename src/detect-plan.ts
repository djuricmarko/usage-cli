import type { ApiClient } from "./api.js";
import { ApiError } from "./api.js";
import type { PlanType, GitHubUser } from "./types.js";
import { getAuthenticatedUser } from "./api/user.js";

export interface PlanDetectionResult {
  planType: PlanType;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Attempts to auto-detect the user's Copilot plan type.
 *
 * Strategy:
 * 1. Fetch the authenticated user's GitHub account plan from GET /user
 * 2. Try to get Copilot subscription details from the billing summary
 * 3. Infer plan type from available signals
 *
 * The GitHub user object has a `plan.name` field:
 *   - "free" → GitHub Free account → Copilot Free (unless they purchased Copilot separately)
 *   - "pro" → GitHub Pro account → likely Copilot Pro (bundled), could be Pro+
 *
 * We also check the billing usage summary for Copilot-related SKUs to
 * differentiate Pro from Pro+ based on discount quantities.
 */
export async function detectPlan(client: ApiClient): Promise<PlanDetectionResult> {
  let user: GitHubUser | null = null;

  try {
    user = await getAuthenticatedUser(client);
  } catch (err) {
    // If we can't get user info, fall back to default
    return {
      planType: "pro",
      confidence: "low",
      reason: "Could not fetch user profile; defaulting to Pro",
    };
  }

  const githubPlan = user.plan?.name?.toLowerCase();

  // Try to differentiate using the billing usage summary.
  // The discountQuantity in premium_request/usage tells us how many
  // requests the plan covers for free. Summing all discountQuantity
  // values gives a signal about the plan's included allowance.
  try {
    const summaryResponse = await client.get<{
      usageItems?: Array<{
        product?: string;
        sku?: string;
        discountQuantity?: number;
        grossQuantity?: number;
        pricePerUnit?: number;
        netAmount?: number;
      }>;
    }>(`/users/${user.login}/settings/billing/usage/summary`, {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });

    if (summaryResponse.usageItems && summaryResponse.usageItems.length > 0) {
      // Look for Copilot premium request items
      const copilotItems = summaryResponse.usageItems.filter(
        (item) =>
          item.product?.toLowerCase().includes("copilot") ||
          item.sku?.toLowerCase().includes("copilot") ||
          item.sku?.toLowerCase().includes("premium")
      );

      if (copilotItems.length > 0) {
        // Sum the discount quantities — this represents included allowance used
        const totalDiscount = copilotItems.reduce(
          (sum, item) => sum + (item.discountQuantity ?? 0),
          0
        );
        const totalGross = copilotItems.reduce(
          (sum, item) => sum + (item.grossQuantity ?? 0),
          0
        );

        // The discount quantity can't exceed the plan's allowance.
        // If discountQuantity is close to or at 1500, it's Pro+.
        // If discountQuantity is close to or at 300, it's Pro.
        // If discountQuantity is close to or at 50, it's Free.
        //
        // However, early in the month the user may not have used many
        // requests yet, so we can only use this as an upper-bound signal.
        // We check: if totalDiscount > 300, it MUST be Pro+ (can't discount
        // more than your allowance). If totalDiscount > 50, it's at least Pro.

        if (totalDiscount > 300) {
          return {
            planType: "pro-plus",
            confidence: "high",
            reason: `Detected ${totalDiscount} discounted premium requests (exceeds Pro limit of 300)`,
          };
        }

        if (totalDiscount > 50) {
          // More than Free limit of 50 discounted. Must be Pro or higher.
          // Check GitHub plan to differentiate
          return {
            planType: "pro",
            confidence: "high",
            reason: `Detected ${totalDiscount} discounted premium requests (exceeds Free limit of 50)`,
          };
        }
      }
    }
  } catch {
    // Billing summary not available — fall through to GitHub plan heuristic
  }

  // Fall back to GitHub account plan heuristic
  if (githubPlan === "free") {
    return {
      planType: "free",
      confidence: "medium",
      reason: "GitHub Free account detected; assuming Copilot Free",
    };
  }

  if (githubPlan === "pro") {
    return {
      planType: "pro",
      confidence: "medium",
      reason: "GitHub Pro account detected; assuming Copilot Pro",
    };
  }

  // Unknown or enterprise-like plan
  return {
    planType: "pro",
    confidence: "low",
    reason: `GitHub plan "${githubPlan ?? "unknown"}" detected; defaulting to Pro`,
  };
}
