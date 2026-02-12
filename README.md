# usage-cli

A terminal dashboard for tracking your GitHub Copilot premium request usage.

Authenticates via the GitHub CLI (`gh`), fetches your personal billing data from the GitHub REST API, and renders a color-coded terminal dashboard showing premium request consumption per model, progress toward your monthly quota, and cost breakdown.

## Example Output

```
  GitHub Copilot Usage
  ──────────────────────────────────────────────────
  @username  |  Plan: Copilot Pro ($10)  |  auto-detected
  Period: February 2026  |  Resets Mar 1, 2026 (17 days)

  Premium Requests  187 / 300 used
  ████████████████████████████░░░░░░░░░░░░░░░░░░░░  62.3%

  113 premium requests remaining  |  Overage cost: $0.00

  Model Breakdown
  ┌─────────────────────┬──────────┬────────────┬──────────────┬────────┐
  │ Model               │ Requests │ Multiplier │ Premium Reqs │   Cost │
  ├─────────────────────┼──────────┼────────────┼──────────────┼────────┤
  │ Claude Sonnet 4     │       85 │         1x │           85 │  $0.00 │
  │ GPT-5               │       52 │         1x │           52 │  $0.00 │
  │ Claude Opus 4.5     │       15 │         3x │           45 │  $0.00 │
  │ Claude Haiku 4.5    │       15 │      0.33x │            5 │  $0.00 │
  │ GPT-4o              │      200 │  0x (incl) │            — │  $0.00 │
  ├─────────────────────┼──────────┼────────────┼──────────────┼────────┤
  │ Total               │      367 │            │          187 │  $0.00 │
  └─────────────────────┴──────────┴────────────┴──────────────┴────────┘

  * 200 requests used included models (not counted toward premium quota)
  * Quota resets: 2026-03-01 00:00:00 UTC
```

## Features

- **Color-coded progress bar** -- green when under 50%, yellow at 50-80%, red above 80%
- **Per-model breakdown** with multiplier and premium request calculations
- **All Copilot plans** supported (Free, Pro, Pro+, Business, Enterprise)
- **Auto-detects your Copilot plan** -- no `--plan` flag needed in most cases
- **Proactive scope validation** -- detects missing `user` token scope before hitting the API
- **JSON output mode** for scripting and piping (`--json`)
- **Historical queries** -- look up any past month's usage
- **Zero config** -- just needs `gh` CLI authenticated

## Prerequisites

- **Node.js** >= 18.0.0
- **GitHub CLI** (`gh`) installed and authenticated -- [https://cli.github.com](https://cli.github.com)
- **Personal Copilot subscription** (Free, Pro, or Pro+)

> **Note:** If your Copilot license is managed through an organization or enterprise, usage is billed at the org level and the user-level billing API won't return data. Org-level support is planned for a future release.

## Installation

```bash
git clone <repo-url>
cd usage-cli
npm install
npm run build
```

For global access via the `usage-cli` command:

```bash
npm link
usage-cli
```

For development:

```bash
npm run dev
# or
npx tsx src/index.ts
```

## Authentication

The CLI uses `gh auth token` under the hood to obtain your OAuth token. No manual token management is needed.

However, the GitHub billing API requires the `user` scope, which is **not** included in the default `gh auth login` token. You need to add it once:

```bash
gh auth refresh -s user
```

### How scope checking works

When you run `usage-cli`, it:

1. Obtains your token via `gh auth token`
2. Parses `gh auth status` to check which scopes the token has
3. If the `user` scope is missing, it exits immediately with a clear message telling you exactly what command to run

You only need to run `gh auth refresh -s user` once. The scope persists across sessions.

## Usage

```
usage-cli [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--plan <type>` | Override plan detection: `free`, `pro`, `pro-plus`, `business`, `enterprise` | Auto-detected |
| `--month <n>` | Month to query (1-12) | Current month |
| `--year <n>` | Year to query | Current year |
| `--json` | Output raw JSON instead of the formatted dashboard | Off |
| `--no-color` | Disable terminal colors | Off |
| `-V, --version` | Show version number | |
| `-h, --help` | Show help | |

### Examples

```bash
# Show current month usage (plan is auto-detected)
usage-cli

# Override the detected plan
usage-cli --plan pro-plus
usage-cli --plan free

# Query a past month
usage-cli --month 1 --year 2026

# JSON output for scripting
usage-cli --json
usage-cli --json | jq '.usage.percentUsed'

# Pipe-friendly: disable colors
usage-cli --no-color
```

## Plan Auto-Detection

When you run `usage-cli` without the `--plan` flag, it automatically detects your Copilot plan:

1. **Billing data analysis** -- checks your premium request discount quantities against known plan allowances (50 for Free, 300 for Pro, 1500 for Pro+)
2. **GitHub account plan** -- falls back to `GET /user` to check if you're on a Free or Pro GitHub account

The detection reports a confidence level:

| Confidence | Meaning |
|------------|---------|
| **high** | Billing data confirms the plan (e.g., discount quantity exceeds a lower tier's limit) |
| **medium** | Inferred from GitHub account plan (usually correct but not definitive) |
| **low** | Could not determine; defaulted to Pro |

If detection is wrong, override it with `--plan <type>`.

## Plan Reference

| Plan | Price | Premium Reqs/Month | Included Models (0x) |
|------|-------|--------------------|----------------------|
| Free | $0 | 50 | None (all models cost 1x) |
| Pro | $10/mo | 300 | GPT-4o, GPT-4.1, GPT-5 mini, Raptor mini |
| Pro+ | $39/mo | 1,500 | GPT-4o, GPT-4.1, GPT-5 mini, Raptor mini |
| Business | $19/seat/mo | 300/user | GPT-4o, GPT-4.1, GPT-5 mini, Raptor mini |
| Enterprise | $39/seat/mo | 1,000/user | GPT-4o, GPT-4.1, GPT-5 mini, Raptor mini |

Included models consume **0 premium requests** on paid plans. Quotas reset on the **1st of each month at 00:00 UTC**. Overages are billed at **$0.04 per premium request**.

## Model Multipliers

Each model has a multiplier that determines how many premium requests a single use consumes. For example, a model with a 3x multiplier uses 3 premium requests per interaction.

### Included (0x on paid plans)

| Model | Paid Plans | Free Plan |
|-------|-----------|-----------|
| GPT-4o | 0x | 1x |
| GPT-4.1 | 0x | 1x |
| GPT-5 mini | 0x | 1x |
| Raptor mini | 0x | 1x |

### Low Cost (0.25x - 0.33x)

| Model | Multiplier |
|-------|------------|
| Claude Haiku 4.5 | 0.33x |
| Gemini 3 Flash | 0.33x |
| GPT-5.1-Codex-Mini | 0.33x |
| Grok Code Fast 1 | 0.25x |

### Standard (1x)

| Model | Multiplier |
|-------|------------|
| Claude Sonnet 4 | 1x |
| Claude Sonnet 4.5 | 1x |
| Gemini 2.5 Pro | 1x |
| Gemini 3 Pro | 1x |
| GPT-5 | 1x |
| GPT-5-Codex | 1x |
| GPT-5.1 | 1x |
| GPT-5.1-Codex | 1x |
| GPT-5.1-Codex-Max | 1x |
| GPT-5.2 | 1x |
| GPT-5.2-Codex | 1x |
| GPT-5.3-Codex | 1x |

### High Cost (3x)

| Model | Multiplier |
|-------|------------|
| Claude Opus 4.5 | 3x |
| Claude Opus 4.6 | 3x |

### Ultra Cost (9x - 10x)

| Model | Multiplier |
|-------|------------|
| Claude Opus 4.6 (fast mode) | 9x |
| Claude Opus 4.1 | 10x |

## How It Works

1. **Auth** -- Runs `gh auth token` to obtain your OAuth token. Parses `gh auth status` to validate the `user` scope is present.
2. **User lookup** -- Calls `GET /user` to resolve the authenticated GitHub username.
3. **Plan detection** -- Analyzes billing discount quantities and GitHub account plan to auto-detect your Copilot tier (or uses `--plan` override).
4. **Billing API** -- Calls `GET /users/{username}/settings/billing/premium_request/usage` with `year` and `month` query parameters to fetch premium request usage for the billing period.
5. **Data transform** -- Maps each usage item's model name to its known multiplier, calculates premium request consumption (`raw requests x multiplier`), and identifies included models that cost 0 premium requests on paid plans.
6. **Render** -- Builds the terminal dashboard: styled header, color-coded progress bar, model breakdown table with totals, and footer notes with reset date and cost information.

The tool uses the [GitHub Billing Usage API](https://docs.github.com/en/rest/billing/usage), specifically the premium request usage endpoint for individual users.

> **Note:** The legacy Copilot Metrics API (`/orgs/{org}/copilot/metrics`) is shutting down on April 2, 2026. This tool uses the newer billing usage API which provides premium request tracking per model.

## Project Structure

```
usage-cli/
  package.json              Project config, ESM, dependencies
  tsconfig.json             TypeScript config (ES2022, NodeNext)
  src/
    index.ts                CLI entry point -- arg parsing and orchestration
    auth.ts                 GitHub CLI auth and token scope validation
    api.ts                  Generic API client with typed error handling
    types.ts                TypeScript types for all API responses
    detect-plan.ts          Auto-detection of Copilot plan type
    api/
      premium-usage.ts      Premium request usage endpoint
      usage-summary.ts      Usage summary endpoint (extensible)
      user.ts               Authenticated user endpoint
    models/
      plan-limits.ts        Plan allowances, model multipliers, reset date helpers
    ui/
      colors.ts             GitHub-themed terminal color palette
      header.ts             Dashboard header (user, plan, period, reset)
      progress-bar.ts       Color-coded quota progress bar
      table.ts              Model breakdown table with multipliers and costs
      render.ts             Main render orchestrator and JSON output
```

## Troubleshooting

### "Missing required token scopes: user"

Your `gh` token needs the `user` scope to access the billing API. Run:

```bash
gh auth refresh -s user
```

### 404 Not Found from the billing API

This can happen if:

1. **Your Copilot subscription is managed by an organization** -- the user-level billing endpoint only returns data for personal subscriptions (Free, Pro, Pro+). Org-managed licenses are billed at the org level.
2. **Your token doesn't have the `user` scope** -- see the fix above.
3. **You don't have an active Copilot subscription** -- sign up at [github.com/settings/copilot](https://github.com/settings/copilot).
4. **Your account doesn't have the enhanced billing platform** -- the billing API is only available to accounts on GitHub's enhanced billing platform.

### "GitHub CLI (gh) is not installed"

Install the GitHub CLI from [https://cli.github.com](https://cli.github.com).

### "Not authenticated with GitHub CLI"

Log in with:

```bash
gh auth login
```

Then add the required scope:

```bash
gh auth refresh -s user
```

## License

MIT
