---
name: anima
description: |
  Gives an AI agent a full identity — email inbox, phone number, voice, encrypted vault, addresses, DID — and the tools to use them. Use when the user says "create an agent", "give my agent email", "send email as agent", "fetch with x402", "store a secret in the vault", "set up a phone number", or asks to spin up identity for an autonomous workflow. Use when the user asks to install or connect Anima.
allowed-tools:
  - Bash(anima:*)
  - Bash(am:*)
  - Bash(npx:*)
  - Bash(bunx:*)
  - Bash(npm:*)
  - Bash(bun:*)
license: Complete terms in LICENSE
version: 0.5.0
metadata:
  author: anima-labs
  url: https://useanima.sh/agents
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
  requires:
    bins:
      - anima
    install:
      - kind: node
        package: "@anima-labs/cli"
        bins: [anima, am]
user-invocable: true
---

# Anima — identity & infrastructure for AI agents

Anima gives an autonomous agent a verified identity (email, phone, voice, vault, addresses, W3C DID) and the tools to act on it. Agents can sign up for SaaS, receive OTPs, take calls, and store secrets — all gated by a unified policy engine.

> **Note (May 2026):** Wave 3 shipped on 2026-05-05.
>
> - **`anima mpp decode`** — fully implemented (parses WWW-Authenticate Payment challenges)
> - **`anima mpp pay`** — contract-stable; server returns 501 with workaround until the SPT settlement loop ships
> - **`/oauth/authorize`** consent surface — fully implemented at `useanima.sh/oauth/authorize`; the `/oauth/token` exchange + scope-enforcement middleware ship in Wave 3J.2
> - **MCP tools** — `mpp_pay` + `mpp_decode` registered.
>
> Track release: `anima auth whoami --human` shows CLI version; v0.6.0+ has Wave 3.

## Choosing how to call Anima

Anima ships an **MCP server** and a **standalone CLI**. Always prefer the MCP server when available — it avoids shell-parsing edge cases and is the intended integration path.

1. **Check for the MCP server first.** Look for an `anima` MCP server in your active MCP connections. If present, call its tools directly (e.g. `whoami`, `agent_create`, `email_send`, `x402_fetch`).
2. **Fall back to the CLI** only if the MCP server is not available. Install it with `npm install -g @anima-labs/cli`, then use the shell commands documented below.

The rest of this document shows CLI commands. When using the MCP server, map each command to its corresponding MCP tool — the parameters and behaviour are identical.

| CLI command | MCP tool |
|---|---|
| `anima auth login` | `mcp__anima__auth_login` |
| `anima auth whoami` | `mcp__anima__whoami` |
| `anima identity create` | `mcp__anima__agent_create` |
| `anima email send` | `mcp__anima__email_send` |
| `anima email list` | `mcp__anima__email_list` |
| `anima phone provision` | `mcp__anima__phone_provision` |
| `anima phone send-sms` | `mcp__anima__phone_send_sms` |
| `anima vault store` | `mcp__anima__vault_create_credential` |
| `anima vault get` | `mcp__anima__vault_get_credential` |
| `anima vault totp` | `mcp__anima__vault_get_totp` |
| `anima x402 fetch` | `mcp__anima__x402_fetch` |
| `anima mpp pay` | `mcp__anima__mpp_pay` |
| `anima mpp decode` | `mcp__anima__mpp_decode` |
| `anima webhook create` | `mcp__anima__webhook_create` |

## Output format — agent vs human

All commands default to **agent format** (compact JSON, low-token). Pass `--human` for box-drawn tables and color. Pass `--format <fmt>` for `yaml`, `jsonl`, `md`, or pretty `json`.

Agents should always rely on the default output and parse JSON via `jq`-style tooling. Errors are emitted as `{"status":"error","message":"..."}` on stderr with exit code 1.

## Running commands (CLI fallback)

All commands accept `--format json|yaml|jsonl|md` for machine-readable output. Pass input via flags (run `anima <command> --help` to see full schema details).

**IMPORTANT:** Run `auth login` with `run_in_background=true` (or `TaskOutput(task_id, block: false)`). It emits JSON to stdout immediately, then keeps running while polling for user action.

Agent-facing JSON contract:

- `auth login`: first object contains `verification_url` and `phrase`; final object contains the authentication result after the user approves
- `whoami`: returns identity payload with optional `update` field if a newer CLI version is available

For `auth login`, keep reading stdout until the process exits. The user MUST visit the verification URL to continue. **Always show the full URL in clear text.**

## Core flow — pay for an API with x402

```bash
anima x402 fetch <url> --budget-limit-cents 500
```

Returns `paid`, `settlement`, and the response body. Pass `--sandbox` for dry-run.

For 402 responses with `WWW-Authenticate: Payment` challenges:

```bash
anima mpp decode --challenge '<full-header>'
```

This validates the challenge, decodes the request payload, and returns the extracted `network_id` and decoded request JSON.

## Core flow — give the agent its own email/phone

```bash
# Create the agent identity
anima identity create --name "<agent-name>" --display-name "<Display Name>"

# Send email
anima email send --from <agent>@<domain> --to user@example.com --subject "Hello" --text "Hi"

# Provision phone
anima phone provision --area-code 415

# Send SMS
anima phone send-sms --to +14155550100 --text "Verification code: 123456"
```

For inbound, register a webhook so the agent reacts to incoming messages:

```bash
anima webhook create --url https://your-app.example.com/webhooks/anima \
  --events email.received,sms.received
```

## Core flow — secrets in the vault

The vault keeps long-lived credentials out of the LLM context window. Tokens are injected at egress via 60-second ephemeral handles — the LLM only ever sees the handle, never the secret.

```bash
anima vault provision
anima vault store --label openai_api_key --value "sk-..."
anima vault get --label openai_api_key       # returns ephemeral handle
anima vault totp --label "GitHub Auth"        # returns 6-digit code
```

## Important

- **Treat vault secrets extremely carefully** — they grant real system access. Never echo raw secrets into chat history; use ephemeral handles where the API supports them.
- **Respect `/agents.txt` and `/llms.txt` directives** on sites you browse. These files declare whether the site permits automated agent interactions.
- **Avoid suspicious sites** — phishing pages mimicking legitimate sites can steal credentials. If anything about the page feels off (mismatched domain, unusual redirect, unexpected login prompt), stop and ask the user to verify.

## Errors

All errors are output as JSON with `code` and `message` fields, exit code 1.

| Error / symptom | Cause | Recovery |
|---|---|---|
| Command hangs indefinitely | `auth login` ran synchronously | Always run `auth login` with `run_in_background=true` — it blocks until user action; synchronous execution freezes the agent |
| Auth token expired mid-session | Token refresh failed during background polling | Re-authenticate with `auth login` |
| 401 on any command | `ANIMA_API_KEY` missing/invalid, or stored token expired | Run `anima auth login` again, or set `ANIMA_API_KEY=ak_...` |
| 403 `scope_not_granted` | OAuth grant didn't include this scope | Re-authorize with the missing scope via the consent URL, or ask the org owner to expand the grant |

## Further docs

- Anima docs: https://docs.useanima.sh
- Anima skill manifest: https://useanima.sh/skill.md
- Anima `agents.txt`: https://useanima.sh/agent.txt
- Anima `llms.txt`: https://useanima.sh/llms.txt
- MPP/x402 protocol: https://docs.useanima.sh/protocols/mpp, https://docs.useanima.sh/protocols/x402
- Console: https://console.useanima.sh
- OAuth consent: https://connect.useanima.sh
- Support / questions: https://discord.gg/pY3GK59Z9E
