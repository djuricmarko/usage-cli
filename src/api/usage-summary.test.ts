import { describe, it, expect, vi } from "vitest";
import { getUsageSummary } from "./usage-summary.js";
import type { ApiClient } from "../api.js";

function createMockClient(): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({
      timePeriod: { year: 2025, month: 1 },
      usageItems: [],
    }),
  } as unknown as ApiClient;
}

describe("getUsageSummary", () => {
  it("calls correct API path with username", async () => {
    const client = createMockClient();
    await getUsageSummary(client, { username: "testuser" });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/usage/summary",
      {}
    );
  });

  it("passes year, month, day params when provided", async () => {
    const client = createMockClient();
    await getUsageSummary(client, {
      username: "testuser",
      year: 2025,
      month: 3,
      day: 10,
    });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/usage/summary",
      { year: 2025, month: 3, day: 10 }
    );
  });

  it("passes product and sku params", async () => {
    const client = createMockClient();
    await getUsageSummary(client, {
      username: "testuser",
      product: "Copilot",
      sku: "premium",
    });

    expect(client.get).toHaveBeenCalledWith(
      "/users/testuser/settings/billing/usage/summary",
      { product: "Copilot", sku: "premium" }
    );
  });

  it("omits optional params when not provided", async () => {
    const client = createMockClient();
    await getUsageSummary(client, { username: "user1" });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params).toEqual({});
  });
});
