import { describe, it, expect, vi } from "vitest";
import { getPremiumRequestUsage } from "./premium-usage.js";
import type { ApiClient } from "../api.js";

function createMockClient(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({
      timePeriod: { year: 2025, month: 1 },
      usageItems: [],
    }),
  } as unknown as ApiClient;
}

describe("getPremiumRequestUsage", () => {
  it("calls correct API path with username", async () => {
    const client = createMockClient();
    await getPremiumRequestUsage(client, { username: "testuser" });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/premium_request/usage",
      {}
    );
  });

  it("passes year, month, day params when provided", async () => {
    const client = createMockClient();
    await getPremiumRequestUsage(client, {
      username: "testuser",
      year: 2025,
      month: 6,
      day: 15,
    });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/premium_request/usage",
      { year: 2025, month: 6, day: 15 }
    );
  });

  it("passes model and product params", async () => {
    const client = createMockClient();
    await getPremiumRequestUsage(client, {
      username: "testuser",
      model: "GPT-4o",
      product: "Copilot",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/premium_request/usage",
      { model: "GPT-4o", product: "Copilot" }
    );
  });

  it("omits optional params when not provided", async () => {
    const client = createMockClient();
    await getPremiumRequestUsage(client, { username: "user1" });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params).toEqual({});
  });
});
