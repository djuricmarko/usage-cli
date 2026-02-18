import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process before importing auth
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

import { getAuthToken, ensureScopes, getAuthInfo } from "./auth.js";
import { execSync } from "node:child_process";

const mockExecSync = vi.mocked(execSync);

describe("getAuthToken", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockExecSync.mockReset();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("returns token on success", () => {
    mockExecSync.mockReturnValueOnce("gho_test_token_12345");

    const token = getAuthToken();
    expect(token).toBe("gho_test_token_12345");
  });

  it("trims whitespace from token", () => {
    mockExecSync.mockReturnValueOnce("  gho_token  \n");

    const token = getAuthToken();
    expect(token).toBe("gho_token");
  });

  it("exits when gh CLI is not installed (ENOENT)", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw Object.assign(new Error("ENOENT"), { status: 127 });
    });

    expect(() => getAuthToken()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits when gh CLI is not found", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw Object.assign(new Error("command not found"), { status: 127 });
    });

    expect(() => getAuthToken()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits when not logged in", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw Object.assign(new Error("auth error"), {
        status: 1,
        stderr: "You are not logged into any GitHub hosts",
      });
    });

    expect(() => getAuthToken()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits on empty token", () => {
    mockExecSync.mockReturnValueOnce("   ");

    expect(() => getAuthToken()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with generic message on unknown errors", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error("something unexpected");
    });

    expect(() => getAuthToken()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

describe("ensureScopes", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockExecSync.mockReset();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("passes when user scope is present", () => {
    mockExecSync.mockReturnValueOnce(
      "Token scopes: 'repo', 'user', 'read:org'"
    );

    expect(() => ensureScopes()).not.toThrow();
  });

  it("passes when read:user scope is present", () => {
    mockExecSync.mockReturnValueOnce(
      "Token scopes: 'repo', 'read:user'"
    );

    expect(() => ensureScopes()).not.toThrow();
  });

  it("exits when user scope is missing", () => {
    mockExecSync.mockReturnValueOnce(
      "Token scopes: 'repo', 'read:org'"
    );

    expect(() => ensureScopes()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("exits when no scopes found at all", () => {
    mockExecSync.mockReturnValueOnce("some output without scopes");

    expect(() => ensureScopes()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("handles gh auth status error but still parses scopes from stderr", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw Object.assign(new Error(""), {
        stdout: "",
        stderr: "Token scopes: 'repo', 'user'",
      });
    });

    expect(() => ensureScopes()).not.toThrow();
  });
});

describe("getAuthInfo", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockExecSync.mockReset();
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    vi.unstubAllGlobals();
  });

  it("returns token and username on success", async () => {
    // First call: getAuthToken -> gh auth token
    mockExecSync.mockReturnValueOnce("gho_token123");
    // Second call: ensureScopes -> gh auth status
    mockExecSync.mockReturnValueOnce("Token scopes: 'user', 'repo'");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ login: "myuser" }),
    });

    const result = await getAuthInfo();
    expect(result.token).toBe("gho_token123");
    expect(result.username).toBe("myuser");
  });

  it("exits on 401 response", async () => {
    mockExecSync.mockReturnValueOnce("gho_expired_token");
    mockExecSync.mockReturnValueOnce("Token scopes: 'user'");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(getAuthInfo()).rejects.toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("throws on non-401 error response", async () => {
    mockExecSync.mockReturnValueOnce("gho_token");
    mockExecSync.mockReturnValueOnce("Token scopes: 'user'");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(getAuthInfo()).rejects.toThrow("Failed to fetch user info");
  });
});
