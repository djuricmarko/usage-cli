#!/usr/bin/env node

import { Command } from "commander";
import { getAuthInfo } from "./auth.js";
import { ApiClient, ApiError } from "./api.js";
import { getPremiumRequestUsage } from "./api/premium-usage.js";
import { render, renderJson } from "./ui/render.js";
import { theme } from "./ui/colors.js";
import type { PlanType } from "./types.js";

const VALID_PLANS: PlanType[] = ["free", "pro", "pro-plus", "business", "enterprise"];

const program = new Command();

program
  .name("usage-cli")
  .description("GitHub Copilot premium request usage dashboard")
  .version("0.1.0")
  .option(
    "--plan <type>",
    `Your Copilot plan (${VALID_PLANS.join("|")})`,
    "pro"
  )
  .option("--month <number>", "Month to query (1-12)", String(new Date().getMonth() + 1))
  .option("--year <number>", "Year to query", String(new Date().getFullYear()))
  .option("--json", "Output raw JSON instead of formatted UI", false)
  .option("--no-color", "Disable colors")
  .action(async (options) => {
    try {
      const planType = options.plan as PlanType;
      if (!VALID_PLANS.includes(planType)) {
        console.error(
          theme.error(`Invalid plan: ${options.plan}`) +
            `\nValid plans: ${VALID_PLANS.join(", ")}`
        );
        process.exit(1);
      }

      const month = parseInt(options.month, 10);
      const year = parseInt(options.year, 10);

      if (isNaN(month) || month < 1 || month > 12) {
        console.error(theme.error("Invalid month. Must be 1-12."));
        process.exit(1);
      }

      if (isNaN(year) || year < 2024 || year > 2100) {
        console.error(theme.error("Invalid year."));
        process.exit(1);
      }

      // Authenticate
      if (!options.json) {
        process.stdout.write(theme.muted("  Authenticating with GitHub CLI..."));
      }

      const auth = await getAuthInfo();

      if (!options.json) {
        process.stdout.write(
          `\r  ${theme.success("✓")} Authenticated as ${theme.primary("@" + auth.username)}    \n`
        );
      }

      // Fetch usage data
      if (!options.json) {
        process.stdout.write(theme.muted("  Fetching usage data..."));
      }

      const client = new ApiClient({ token: auth.token });

      let premiumUsage;
      try {
        premiumUsage = await getPremiumRequestUsage(client, {
          username: auth.username,
          year,
          month,
        });
      } catch (apiErr) {
        if (apiErr instanceof ApiError && apiErr.isNotFound) {
          // Clear loading line
          if (!options.json) {
            process.stdout.write("\r" + " ".repeat(60) + "\r");
          }
          console.error(
            `\n  ${theme.error("Error:")} The billing API returned 404 (Not Found).\n\n` +
              `  This can happen if:\n` +
              `  ${theme.muted("1.")} Your Copilot subscription is managed by an organization\n` +
              `     (not a personal/individual subscription)\n` +
              `  ${theme.muted("2.")} Your token doesn't have the required "user" scope\n` +
              `     Fix: ${theme.primary("gh auth refresh -s user")}\n` +
              `  ${theme.muted("3.")} You don't have an active Copilot subscription\n` +
              `  ${theme.muted("4.")} Your account doesn't have the enhanced billing platform\n`
          );
          process.exit(1);
        }
        throw apiErr;
      }

      if (!options.json) {
        process.stdout.write(
          `\r  ${theme.success("✓")} Usage data loaded            \n`
        );
      }

      // Render output
      if (options.json) {
        console.log(
          renderJson({
            username: auth.username,
            planType,
            year,
            month,
            premiumUsage,
          })
        );
      } else {
        // Clear the loading lines
        process.stdout.write("\x1b[2A\x1b[J");

        console.log(
          render({
            username: auth.username,
            planType,
            year,
            month,
            premiumUsage,
          })
        );
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        console.error(`\n  ${theme.error("Error:")} ${error.getUserMessage()}\n`);

        if (error.isForbidden) {
          console.error(
            theme.muted(
              "  Tip: Try re-authenticating with additional scopes:\n" +
                "  gh auth refresh -s user\n"
            )
          );
        }

        process.exit(1);
      }

      const err = error as Error;
      console.error(`\n  ${theme.error("Error:")} ${err.message}\n`);
      process.exit(1);
    }
  });

program.parse();
