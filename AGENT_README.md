# Bhatman Begins — Fantasy Agent

Experimental remote ESPN Fantasy MCP + safety-gated lineup assistant. Adapted from [tlo1216/espn-fantasy-mcp](https://github.com/tlo1216/espn-fantasy-mcp) (MIT license included).

## Current status

Source uploaded; **not deployed or authenticated**. No ESPN account changes have been made. ESPN's undocumented write endpoints may change and might violate ESPN terms.

## Safety

- Dry-run by default. Agent lineup execution requires both `AUTO_EXECUTE=true` and `WRITES_ENABLED=true`.
- Waiver claims, adds/drops and IR mutations are available through upstream MCP tools, but are **not** executed by the scheduled agent.
- The upstream validation checks roster eligibility, locked games and slot counts; verify dry-run output before activating.
- Never commit `ESPN_S2`, `ESPN_SWID`, or `MCP_BEARER_TOKEN`. Store them in a secret manager, not this chat.
- Expose HTTP only behind HTTPS and authentication. Treat session cookies as equivalent to a password.

## Setup
```bash
npm ci
npm test
npm run build
cp .env.example .env
# locally populate .env, keep WRITES_ENABLED=false
npm run agent:dry
# start HTTP transport
npm run start:http
```

Set `ESPN_LEAGUE_ID=1318109236`, `ESPN_TEAM_ID=6`, `ESPN_SEASON=2026`, `ESPN_SPORT=ffl`, `ESPN_S2` and `ESPN_SWID`. Set `MCP_BEARER_TOKEN` to a 32+ character random secret.

## Scheduling

GitHub Actions workflow runs four times per week. It **only** analyzes the lineup with ESPN projections and creates an artifact, and has writes hard-disabled. The separately configured ChatGPT recurring tasks provide research from injury reports, rankings, and fantasy communities; they do not directly trigger these GitHub writes.

## Next validation gates
1. Create a **private repository** for production deployment. Current source branch is in an existing public repository because the GitHub connector cannot create repos.
2. Verify tests and build in CI.
3. Configure secrets in private infrastructure.
4. Run the HTTP server through HTTPS with a private/authorized client.
5. Run dry-run against live roster, inspect any recommendations and ESPN lock behavior.
6. Enable actual lineup writes explicitly only after verification. Do not automate free-agent/waiver changes without additional guardrails, freshness checks, and audit history.
