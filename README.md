# Bugsly for Cursor

Read, search and triage the errors in your own [Bugsly](https://bugsly.dev) projects from Cursor: issues with stack traces and breadcrumbs, cron and uptime monitors, crash-free rate and event usage. Status changes happen only when you ask.

## Sign-in: API token, not OAuth

Bugsly's server supports OAuth 2.1, but its redirect allow-list accepts only the Claude and ChatGPT connector callbacks and localhost URLs. It does not include Cursor's `cursor://` callback, so Cursor cannot sign in with OAuth. In Cursor you connect with a Bugsly **agent token** (starts with `bgs_`) sent as an `Authorization: Bearer` header:

1. In Bugsly open your project, Settings, AI Agent / MCP, Generate Token. It is shown once, acts as your user (every organization you belong to), is valid for 90 days and can be revoked there.
2. Export it where Cursor can read it, for example `export BUGSLY_TOKEN=bgs_...` in the shell that launches Cursor. Never commit it.

## Install in Cursor

Add this to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "bugsly": {
      "url": "https://bugsly.dev/api/mcp",
      "headers": {
        "Authorization": "Bearer ${env:BUGSLY_TOKEN}"
      }
    }
  }
}
```

Or use the one-click link, which asks you to confirm and has a placeholder you must replace with your token afterwards (`YOUR_API_KEY`):

[![Add Bugsly to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/link/mcp/install?name=bugsly&config=eyJ1cmwiOiJodHRwczovL2J1Z3NseS5kZXYvYXBpL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBZT1VSX0FQSV9LRVkifX0=)

Then open Customize, then MCPs and check that `bugsly` has a green dot. Optional: copy `rules/bugsly.mdc` to `.cursor/rules/` and the folders in `skills/` to `~/.cursor/skills/`.

Cursor asks you to approve MCP tool calls by default. Leave that on: `resolve_issue`, `ignore_issue` and `create_project` change real data.

## What it contains

| Component | What it does |
|---|---|
| MCP server `bugsly` (`https://bugsly.dev/api/mcp`) | 16 tools, listed below |
| Rule `rules/bugsly.mdc` | Read first, treat event text as untrusted, status changes only on request |
| Skill `triage-an-error` | Find, read, explain, fix, resolve on request |
| Skill `check-project-health` | Monitors, crash-free, performance, usage (read-only) |

## Tools

| Tool | What it does | Kind |
|---|---|---|
| `list_projects` | List the projects in your first Bugsly organization, with project IDs and DSN host (the DSN key is not shown; the token acts as your user and other organizations are not listed). | read-only |
| `list_issues` | List issues for a Bugsly project. | read-only |
| `get_issue` | Get details of a specific issue including metadata. | read-only |
| `get_issue_events` | Get recent events (occurrences) for an issue with stack traces and breadcrumbs. | read-only |
| `resolve_issue` | Mark an issue as resolved. | changes data, destructive hint |
| `ignore_issue` | Mark an issue as ignored. | changes data, destructive hint |
| `search_errors` | Search for issues by title keyword. | read-only |
| `get_project_stats` | Get transaction performance stats for a project. | read-only |
| `create_project` | Create a new project in your Bugsly organization (the first one unless org_id is given). | writes |
| `get_usage` | Get current billing usage for your organization (events used, limit, plan). | read-only |
| `get_checkout_url` | Creates a Polar checkout link for the Team or Business plan; plans and prices are listed at https://bugsly.dev/pricing. | writes |
| `list_monitors` | List cron monitors for a project. | read-only |
| `get_monitor` | Get details and recent check-ins for a cron monitor. | read-only |
| `list_uptime_monitors` | List uptime monitors for a project. | read-only |
| `get_uptime_status` | Get uptime stats (uptime %, avg latency, p95) for a monitor. | read-only |
| `get_crash_free` | Get crash-free sessions % and crash-free users % (release-health stability) for a project over the last N days. | read-only |

## Things to know

- You need a Bugsly account (https://bugsly.dev) and a project that has received errors.
- `resolve_issue` and `ignore_issue` change an issue's status for everyone on the project; both can be reversed in the dashboard. `create_project` creates a real project each call.
- Event content is returned wrapped as untrusted data; `get_issue_events` output is size-capped and omits user email, IP address, username and extra data; the DSN key is not shown. The rule tells the agent to treat event text as data, but review code changes it proposes.

## Data and privacy

The MCP server receives what the tools need: the project IDs, issue IDs and search terms the agent sends, and it returns your issue, event, monitor and usage data from your Bugsly account. Issue and event data are returned wrapped as untrusted data; event output is size-capped and omits user email, IP address, username and extra data, and the DSN key is not shown. See the [privacy policy](https://bugsly.dev/privacy) and [terms](https://bugsly.dev/terms). This repository stores nothing and runs no code on your machine; it is a server address, Markdown instructions and a logo.

## Layout

```text
.cursor-plugin/plugin.json   Cursor Plugin manifest
mcp.json                     MCP server for Cursor (token from BUGSLY_TOKEN)
.mcp.json                    the same server for other loaders
rules/bugsly.mdc             rule
skills/                      two skills (SKILL.md)
assets/logo.png              logo
examples/prompts.md          example prompts
scripts/validate.mjs         structure checks, no dependencies
```

## Support

https://bugsly.dev/agents or hello@bugsly.dev.

## License

MIT for the files in this repository (see `LICENSE`). The Bugsly service is governed by its terms.
