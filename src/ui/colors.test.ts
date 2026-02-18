import { describe, it, expect } from "vitest";
import { theme, getUsageColor, getMultiplierColor } from "./colors.js";

describe("theme", () => {
  it("has all expected keys as functions", () => {
    const expectedKeys = [
      "primary", "secondary", "accent",
      "success", "warning", "error", "info",
      "heading", "subheading", "label", "value", "muted", "dim",
      "included", "low", "standard", "high", "ultra",
      "border", "separator",
    ];
    for (const key of expectedKeys) {
      expect(typeof (theme as Record<string, unknown>)[key]).toBe("function");
    }
  });

  it("color functions return strings", () => {
    expect(typeof theme.primary("test")).toBe("string");
    expect(typeof theme.error("test")).toBe("string");
    expect(typeof theme.muted("test")).toBe("string");
  });
});

describe("getUsageColor", () => {
  it("returns success color for < 50%", () => {
    const color = getUsageColor(30);
    expect(color).toBe(theme.success);
  });

  it("returns warning color for 50-79%", () => {
    const color = getUsageColor(65);
    expect(color).toBe(theme.warning);
  });

  it("returns error color for >= 80%", () => {
    const color = getUsageColor(90);
    expect(color).toBe(theme.error);
  });

  it("boundary: exactly 50% returns warning", () => {
    const color = getUsageColor(50);
    expect(color).toBe(theme.warning);
  });

  it("boundary: exactly 80% returns error", () => {
    const color = getUsageColor(80);
    expect(color).toBe(theme.error);
  });

  it("returns success for 0%", () => {
    const color = getUsageColor(0);
    expect(color).toBe(theme.success);
  });

  it("returns error for 100%", () => {
    const color = getUsageColor(100);
    expect(color).toBe(theme.error);
  });
});

describe("getMultiplierColor", () => {
  it("returns included color for 0x", () => {
    expect(getMultiplierColor(0)).toBe(theme.included);
  });

  it("returns low color for < 1x", () => {
    expect(getMultiplierColor(0.33)).toBe(theme.low);
    expect(getMultiplierColor(0.25)).toBe(theme.low);
  });

  it("returns standard color for 1x", () => {
    expect(getMultiplierColor(1)).toBe(theme.standard);
  });

  it("returns high color for 1-3x", () => {
    expect(getMultiplierColor(2)).toBe(theme.high);
    expect(getMultiplierColor(3)).toBe(theme.high);
  });

  it("returns ultra color for > 3x", () => {
    expect(getMultiplierColor(9)).toBe(theme.ultra);
    expect(getMultiplierColor(10)).toBe(theme.ultra);
  });
});
