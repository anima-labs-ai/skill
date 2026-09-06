---
name: anima-mcp
description: |
  Connect an AI agent to Anima's hosted MCP server so it gets tools for its own email inbox, US phone number, SMS, voice, and encrypted credential vault — no install, no SDK. Use when the user says "connect Anima MCP", "add the Anima MCP server", "set up Anima in Claude Code / Codex / Cursor / GrokBot / Hermes / OpenClaw / Windsurf", or asks how to give an agent identity tools inside their harness.
allowed-tools:
  - Bash(claude:*)
  - Bash(npx:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
  endpoint: https://mcp.useanima.sh/mcp
user-invocable: true
---

# Anima MCP — identity and communication tools in your harness

Anima is the identity and communication layer for AI agents. The hosted MCP
server exposes that layer as tools, so an agent gets an inbox, a phone number
and a vault without leaving the harness it already runs in.

**Endpoint:** `https://mcp.useanima.sh/mcp` (streamable-http, hosted — nothing
to install)

## Connect

Claude Code:

```bash
claude mcp add --transport http anima https://mcp.useanima.sh/mcp
```

Any harness that reads a standard MCP config:

```json
{
  "mcpServers": {
    "anima": {
      "type": "http",
      "url": "https://mcp.useanima.sh/mcp"
    }
  }
}
```

Works with Claude Code, Codex, Cursor, GrokBot, Hermes, OpenClaw and Windsurf.

## Authenticate

Two paths:

1. **OAuth** — the server advertises its authorization server at
   `/.well-known/oauth-protected-resource`, so a client that supports OAuth
   discovery runs the flow itself. Scopes cover email, phone, addresses,
   webhooks and vault reads.
2. **API key** — set `ANIMA_API_KEY` (an `ak_…` agent key) as a bearer token.
   Get one with `npx @anima-labs/cli init`, or from
   <https://console.useanima.sh>.

## Tools, by domain

Tools are path-routed across six domains — `agent`, `email`, `phone`,
`platform`, `vault`, `extension` — plus the unified `/mcp` endpoint that exposes
all of them.

| Job | Tool |
|---|---|
| Who am I, what plan | `account_overview` |
| Create an identity | `agent_create` |
| Send / read email | `email_send`, `email_list`, `email_get` |
| Get a number | `phone_number_provision`, `phone_number_list` |
| Text | `sms_send`, `sms_list` |
| Call, with transcript | `phone_call_create`, `phone_call_transcript_get` |
| Store a secret | `vault_credential_create` |
| Use a secret | `vault_credential_use`, `vault_credential_get_totp` |
| React to inbound | `webhook_set`, `webhook_test` |

Prefer these over shelling out to the CLI: no shell-parsing edge cases, and the
parameters match the CLI one-to-one if you need to cross-reference.

## Verify it is connected

Call `account_overview`. It returns the org, the active agent, and the tier —
which is also the fastest way to see whether phone and voice are available
(the free tier has neither).

## Notes

- The server is hosted; there is no local process and nothing to keep updated.
- Vault reads are owner-gated. If a call is refused, the human approves in the
  console — `vault_credential_request_create` asks them.
- A discovery manifest lives at `/.well-known/mcp.json` if you need to inspect
  the server programmatically.

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
