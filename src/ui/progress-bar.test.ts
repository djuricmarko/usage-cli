import { describe, it, expect } from "vitest";
import { renderProgressBar, renderMiniBar } from "./progress-bar.js";

describe("renderProgressBar", () => {
  it("renders 0% usage with all empty blocks", () => {
    const output = renderProgressBar({ current: 0, total: 300, width: 20 });
    expect(output).toContain("░");
    expect(output).toContain("0.0%");
  });

  it("renders 50% usage", () => {
    const output = renderProgressBar({ current: 150, total: 300, width: 20 });
    expect(output).toContain("█");
    expect(output).toContain("░");
    expect(output).toContain("50.0%");
  });

  it("renders 100% usage (fully filled)", () => {
    const output = renderProgressBar({ current: 300, total: 300, width: 20 });
    expect(output).toContain("100.0%");
  });

  it("caps at 100% visually when over quota", () => {
    const output = renderProgressBar({ current: 500, total: 300, width: 20 });
    // Should show 100.0% (capped), not 166.7%
    expect(output).toContain("100.0%");
    // All blocks should be filled
    expect(output).not.toContain("░");
  });

  it("includes label when provided", () => {
    const output = renderProgressBar({
      current: 50,
      total: 300,
      label: "Premium Requests",
    });
    expect(output).toContain("Premium Requests");
  });

  it("includes percentage when showPercentage is true", () => {
    const output = renderProgressBar({
      current: 100,
      total: 300,
      showPercentage: true,
    });
    expect(output).toContain("%");
  });

  it("excludes percentage when showPercentage is false", () => {
    const output = renderProgressBar({
      current: 100,
      total: 300,
      showPercentage: false,
      showCount: false,
    });
    expect(output).not.toContain("%");
  });

  it("includes count when showCount is true", () => {
    const output = renderProgressBar({
      current: 100,
      total: 300,
      showCount: true,
    });
    expect(output).toContain("100");
    expect(output).toContain("300");
    expect(output).toContain("used");
  });

  it("handles total = 0 without division by zero", () => {
    const output = renderProgressBar({ current: 0, total: 0, width: 20 });
    expect(output).toContain("0.0%");
    // Should not throw
  });

  it("uses default width when not specified", () => {
    // Default width is 40 — just ensure it doesn't throw
    const output = renderProgressBar({ current: 50, total: 100 });
    expect(output).toBeDefined();
  });
});

describe("renderMiniBar", () => {
  it("renders correct number of filled and empty blocks", () => {
    // 50% of width 20 = 10 filled + 10 empty
    const output = renderMiniBar(50, 100, 20);
    // Count raw block characters (ignoring ANSI codes)
    const stripped = output.replace(/\x1b\[[0-9;]*m/g, "");
    expect(stripped).toHaveLength(20);
  });

  it("handles 0%", () => {
    const output = renderMiniBar(0, 100, 10);
    const stripped = output.replace(/\x1b\[[0-9;]*m/g, "");
    expect(stripped).toBe("░".repeat(10));
  });

  it("handles 100%", () => {
    const output = renderMiniBar(100, 100, 10);
    const stripped = output.replace(/\x1b\[[0-9;]*m/g, "");
    expect(stripped).toBe("█".repeat(10));
  });

  it("caps at 100% for over-quota", () => {
    const output = renderMiniBar(200, 100, 10);
    const stripped = output.replace(/\x1b\[[0-9;]*m/g, "");
    expect(stripped).toBe("█".repeat(10));
  });
});
