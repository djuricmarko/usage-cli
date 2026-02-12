import { theme, getUsageColor } from "./colors.js";

export interface ProgressBarOptions {
  current: number;
  total: number;
  width?: number;
  label?: string;
  showPercentage?: boolean;
  showCount?: boolean;
}

export function renderProgressBar(options: ProgressBarOptions): string {
  const { current, total, width = 40, label, showPercentage = true, showCount = true } = options;

  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const color = getUsageColor(percentage);

  const filledBar = color("█".repeat(filled));
  const emptyBar = theme.muted("░".repeat(empty));
  const bar = `  ${filledBar}${emptyBar}`;

  const lines: string[] = [];

  if (label || showCount) {
    const parts: string[] = [];
    if (label) parts.push(theme.label(label));
    if (showCount) {
      const countStr = `${current.toLocaleString()} / ${total.toLocaleString()} used`;
      parts.push(color(countStr));
    }
    lines.push(`  ${parts.join("  ")}`);
  }

  const barLine = showPercentage
    ? `${bar}  ${color(percentage.toFixed(1) + "%")}`
    : bar;

  lines.push(barLine);

  return lines.join("\n");
}

export function renderMiniBar(current: number, total: number, width: number = 20): string {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const color = getUsageColor(percentage);
  return color("█".repeat(filled)) + theme.muted("░".repeat(empty));
}
