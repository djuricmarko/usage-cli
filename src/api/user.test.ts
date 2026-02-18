import { describe, it, expect, vi } from "vitest";
import { getAuthenticatedUser } from "./user.js";
import type { ApiClient } from "../api.js";

describe("getAuthenticatedUser", () => {
  it("calls GET /user with no params", async () => {
    const mockUser = { login: "testuser", name: "Test User", email: null };
    const client = {
      get: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ApiClient;

    const result = await getAuthenticatedUser(client);

    expect(client.get).toHaveBeenCalledWith("/user");
    expect(result).toEqual(mockUser);
  });

  it("returns full GitHubUser object with plan", async () => {
    const mockUser = {
      login: "testuser",
      name: "Test User",
      email: "test@example.com",
      plan: {
        name: "pro",
        space: 976562499,
        collaborators: 0,
        private_repos: 9999,
      },
    };
    const client = {
      get: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ApiClient;

    const result = await getAuthenticatedUser(client);
    expect(result.plan?.name).toBe("pro");
  });
});
