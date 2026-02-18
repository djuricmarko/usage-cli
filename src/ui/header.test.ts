import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHeader } from "./header.js";

describe("renderHeader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders username", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("@testuser");
  });

  it("renders plan display name", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("Copilot Pro");
  });

  it("renders month and year", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("January");
    expect(output).toContain("2025");
  });

  it("shows auto-detected indicator when planDetected is true", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
      planDetected: true,
      planConfidence: "high",
    });
    expect(output).toContain("auto-detected");
  });

  it("shows override hint when confidence is not high", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
      planDetected: true,
      planConfidence: "medium",
    });
    expect(output).toContain("--plan");
  });

  it("does not show override hint when confidence is high", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
      planDetected: true,
      planConfidence: "high",
    });
    expect(output).not.toContain("--plan");
  });

  it("shows reset info for current month", () => {
    // Current time is Jan 15 2025
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("Resets");
    expect(output).toContain("days");
  });

  it("does not show reset info for past months", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2024,
      month: 6,
    });
    expect(output).not.toContain("Resets");
  });

  it("renders title", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("GitHub Copilot Usage");
  });

  it("renders different plan types correctly", () => {
    const output = renderHeader({
      username: "testuser",
      planType: "pro-plus",
      year: 2025,
      month: 1,
    });
    expect(output).toContain("Copilot Pro+");
  });
});
