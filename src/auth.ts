import { execSync } from "node:child_process";
import type { AuthInfo } from "./types.js";

const REQUIRED_SCOPES = ["user"];

export function getAuthToken(): string {
  try {
    const token = execSync("gh auth token", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!token) {
      throw new Error("Empty token returned");
    }

    return token;
  } catch (error: unknown) {
    const err = error as { status?: number; stderr?: string; message?: string };

    if (err.message?.includes("ENOENT") || err.message?.includes("not found")) {
      console.error(
        "\x1b[31mError: GitHub CLI (gh) is not installed.\x1b[0m\n" +
          "Install it from: https://cli.github.com\n"
      );
      process.exit(1);
    }

    if (err.stderr?.includes("not logged") || err.status === 1) {
      console.error(
        "\x1b[31mError: Not authenticated with GitHub CLI.\x1b[0m\n" +
          "Run: gh auth login\n"
      );
      process.exit(1);
    }

    console.error(
      "\x1b[31mError: Failed to get auth token from GitHub CLI.\x1b[0m\n" +
        `${err.message ?? "Unknown error"}\n`
    );
    process.exit(1);
  }
}

function getTokenScopes(): string[] {
  try {
    const output = execSync("gh auth status 2>&1", {
      encoding: "utf-8" as BufferEncoding,
      shell: "/bin/sh",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const scopeMatch = output.match(/Token scopes:\s*(.+)/i);
    if (scopeMatch) {
      return scopeMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/'/g, ""))
        .filter(Boolean);
    }
    return [];
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string };
    const combined = (err.stdout ?? "") + (err.stderr ?? "");
    const scopeMatch = combined.match(/Token scopes:\s*(.+)/i);
    if (scopeMatch) {
      return scopeMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/'/g, ""))
        .filter(Boolean);
    }
    return [];
  }
}

function checkRequiredScopes(): { missing: string[] } {
  const scopes = getTokenScopes();
  const missing = REQUIRED_SCOPES.filter(
    (required) => !scopes.some((s) => s === required || s === `read:${required}`)
  );
  return { missing };
}

export function ensureScopes(): void {
  const { missing } = checkRequiredScopes();
  if (missing.length > 0) {
    const scopeFlags = missing.map((s) => `-s ${s}`).join(" ");
    console.error(
      `\n\x1b[33mMissing required token scopes: ${missing.join(", ")}\x1b[0m\n\n` +
        `  The billing API requires the "user" scope to access usage data.\n` +
        `  Your current token does not have this scope.\n\n` +
        `  Run this command to add the required scope:\n\n` +
        `    \x1b[36mgh auth refresh ${scopeFlags}\x1b[0m\n\n` +
        `  Then run usage-cli again.\n`
    );
    process.exit(1);
  }
}

export async function getAuthInfo(): Promise<AuthInfo> {
  const token = getAuthToken();

  // Check for required scopes before making API calls
  ensureScopes();

  // Fetch authenticated user info from GitHub API
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error(
        "\x1b[31mError: GitHub token is invalid or expired.\x1b[0m\n" +
          "Run: gh auth login\n"
      );
      process.exit(1);
    }
    throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
  }

  const user = (await response.json()) as { login: string };

  return {
    token,
    username: user.login,
  };
}
