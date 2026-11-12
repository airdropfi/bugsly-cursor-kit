---
name: check-project-health
description: Check the health of a Bugsly project: cron monitors, uptime monitors, crash-free sessions and users, transaction performance and event usage. Read-only. Use when the user asks whether jobs, sites or releases are healthy, or how close they are to their event limit.
license: MIT
compatibility: Needs the Bugsly MCP server connected (API token header in Cursor).
---

# Check project health with Bugsly

All of this is read-only.

1. `list_projects` to get the project ID (never guess; ask if several).
2. Cron jobs: `list_monitors`, then `get_monitor` for any that look late or failing.
3. Uptime: `list_uptime_monitors`, then `get_uptime_status` (uptime %, average latency, p95) for the ones that matter.
4. Stability: `get_crash_free` (default 30 days, max 90). Null percentages mean no sessions have been ingested yet; say that, do not invent a number.
5. Performance: `get_project_stats` (transaction stats, default 24 hours, max 720).
6. Usage: `get_usage` shows events used, the limit and the plan. For plan changes the user decides; `get_checkout_url` only creates a link and charges nothing, so call it only if asked and let the user open it. Quote plans and prices only from https://bugsly.dev/pricing or tool output.

Summarise worst first, with numbers exactly as returned.
