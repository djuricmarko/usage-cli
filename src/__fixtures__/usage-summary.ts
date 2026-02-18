/**
 * Sample billing usage summary responses for plan detection tests.
 */

export const proPlusBillingSummary = {
  usageItems: [
    {
      product: "Copilot",
      sku: "copilot_premium_requests",
      discountQuantity: 400,
      grossQuantity: 500,
      pricePerUnit: 0.04,
      netAmount: 4.0,
    },
    {
      product: "Copilot",
      sku: "copilot_premium_requests",
      discountQuantity: 50,
      grossQuantity: 50,
      pricePerUnit: 0.04,
      netAmount: 0,
    },
  ],
};

export const proBillingSummary = {
  usageItems: [
    {
      product: "Copilot",
      sku: "copilot_premium_requests",
      discountQuantity: 150,
      grossQuantity: 200,
      pricePerUnit: 0.04,
      netAmount: 2.0,
    },
  ],
};

export const freeBillingSummary = {
  usageItems: [
    {
      product: "Copilot",
      sku: "copilot_premium_requests",
      discountQuantity: 30,
      grossQuantity: 30,
      pricePerUnit: 0.04,
      netAmount: 0,
    },
  ],
};

export const emptyBillingSummary = {
  usageItems: [],
};

export const noCopilotBillingSummary = {
  usageItems: [
    {
      product: "Actions",
      sku: "actions_minutes",
      discountQuantity: 2000,
      grossQuantity: 2000,
      pricePerUnit: 0.008,
      netAmount: 0,
    },
  ],
};
