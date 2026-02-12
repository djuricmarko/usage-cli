import chalk from "chalk";

export const theme = {
  // Brand colors
  primary: chalk.hex("#58a6ff"),    // GitHub blue
  secondary: chalk.hex("#8b949e"),  // Muted gray
  accent: chalk.hex("#d2a8ff"),     // Purple accent

  // Status colors
  success: chalk.hex("#3fb950"),    // Green
  warning: chalk.hex("#d29922"),    // Yellow/orange
  error: chalk.hex("#f85149"),      // Red
  info: chalk.hex("#58a6ff"),       // Blue

  // Text colors
  heading: chalk.bold.white,
  subheading: chalk.hex("#8b949e"),
  label: chalk.hex("#c9d1d9"),
  value: chalk.bold.white,
  muted: chalk.hex("#484f58"),
  dim: chalk.dim,

  // Model categories
  included: chalk.hex("#3fb950"),    // Green - free/included
  low: chalk.hex("#58a6ff"),        // Blue - low cost
  standard: chalk.hex("#d29922"),   // Yellow - standard
  high: chalk.hex("#f0883e"),       // Orange - high
  ultra: chalk.hex("#f85149"),      // Red - ultra

  // Special
  border: chalk.hex("#30363d"),
  separator: chalk.hex("#21262d"),
};

export function getUsageColor(percentage: number): typeof chalk {
  if (percentage < 50) return theme.success;
  if (percentage < 80) return theme.warning;
  return theme.error;
}

export function getMultiplierColor(multiplier: number): typeof chalk {
  if (multiplier === 0) return theme.included;
  if (multiplier < 1) return theme.low;
  if (multiplier === 1) return theme.standard;
  if (multiplier <= 3) return theme.high;
  return theme.ultra;
}
