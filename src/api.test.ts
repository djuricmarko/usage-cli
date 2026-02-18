import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, ApiError } from "./api.js";

describe("ApiClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockOkResponse(data: unknown) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });
  }

  function mockErrorResponse(status: number, statusText: string, body = "") {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
      text: () => Promise.resolve(body),
    });
  }

  it("makes GET request to correct URL", async () => {
    const data = { login: "testuser" };
    mockOkResponse(data);

    const client = new ApiClient({ token: "test-token" });
    const result = await client.get("/user");

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.github.com/user");
  });

  it("sends correct authorization headers", async () => {
    mockOkResponse({});

    const client = new ApiClient({ token: "my-secret-token" });
    await client.get("/user");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toEqual({
      Accept: "application/vnd.github+json",
      Authorization: "Bearer my-secret-token",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });

  it("appends query params to URL", async () => {
    mockOkResponse({});

    const client = new ApiClient({ token: "t" });
    await client.get("/path", { year: 2025, month: 1 });

    const [url] = mockFetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("year")).toBe("2025");
    expect(parsed.searchParams.get("month")).toBe("1");
  });

  it("skips undefined and null params", async () => {
    mockOkResponse({});

    const client = new ApiClient({ token: "t" });
    await client.get("/path", { year: 2025, month: undefined as unknown as number });

    const [url] = mockFetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("year")).toBe("2025");
    expect(parsed.searchParams.has("month")).toBe(false);
  });

  it("uses custom baseUrl", async () => {
    mockOkResponse({});

    const client = new ApiClient({ token: "t", baseUrl: "https://custom.api.com" });
    await client.get("/test");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://custom.api.com/test");
  });

  it("throws ApiError on non-ok response", async () => {
    mockErrorResponse(404, "Not Found", '{"message":"not found"}');

    const client = new ApiClient({ token: "t" });

    try {
      await client.get("/missing");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.statusText).toBe("Not Found");
      expect(apiErr.path).toBe("/missing");
    }
  });

  it("handles body read failure gracefully on error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.reject(new Error("body read failed")),
    });

    const client = new ApiClient({ token: "t" });
    await expect(client.get("/fail")).rejects.toThrow(ApiError);
  });
});

describe("ApiError", () => {
  it("isNotFound is true for 404", () => {
    const err = new ApiError(404, "Not Found", "", "/path");
    expect(err.isNotFound).toBe(true);
    expect(err.isForbidden).toBe(false);
    expect(err.isUnauthorized).toBe(false);
  });

  it("isForbidden is true for 403", () => {
    const err = new ApiError(403, "Forbidden", "", "/path");
    expect(err.isForbidden).toBe(true);
    expect(err.isNotFound).toBe(false);
    expect(err.isUnauthorized).toBe(false);
  });

  it("isUnauthorized is true for 401", () => {
    const err = new ApiError(401, "Unauthorized", "", "/path");
    expect(err.isUnauthorized).toBe(true);
    expect(err.isNotFound).toBe(false);
    expect(err.isForbidden).toBe(false);
  });

  it("has correct error name", () => {
    const err = new ApiError(500, "Server Error", "", "/path");
    expect(err.name).toBe("ApiError");
  });

  it("message includes status and path", () => {
    const err = new ApiError(500, "Server Error", "", "/some/path");
    expect(err.message).toContain("500");
    expect(err.message).toContain("/some/path");
  });

  describe("getUserMessage", () => {
    it("returns auth message for 401", () => {
      const err = new ApiError(401, "Unauthorized", "", "/path");
      expect(err.getUserMessage()).toContain("Authentication failed");
    });

    it("returns permissions message for 403", () => {
      const err = new ApiError(403, "Forbidden", "", "/path");
      expect(err.getUserMessage()).toContain("Insufficient permissions");
    });

    it("returns not found message for 404", () => {
      const err = new ApiError(404, "Not Found", "", "/path");
      expect(err.getUserMessage()).toContain("not found");
    });

    it("returns generic message for other status codes", () => {
      const err = new ApiError(500, "Server Error", "", "/path");
      const msg = err.getUserMessage();
      expect(msg).toContain("500");
      expect(msg).toContain("Server Error");
    });
  });
});
