---
name: anima-cli
description: |
  Give an AI agent its own identity and communication channels from the terminal with the Anima CLI (`anima` / `am`) — a real email inbox, a US phone number for SMS and voice, and an encrypted credential vault it can use without exposing secrets to the model. Use when the user says "install the Anima CLI", "give my agent an email", "provision a phone number", "send an email as my agent", "text me now", "call me now", or "store a secret in the vault" and wants shell commands rather than an SDK.
allowed-tools:
  - Bash(anima:*)
  - Bash(am:*)
  - Bash(npm:*)
  - Bash(npx:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
user-invocable: true
---

# Anima CLI — identity and communication for agents, from the shell

Anima is the identity and communication layer for AI agents. Each identity owns
an email inbox, a US phone number for SMS and voice, and an encrypted vault —
so the agent communicates as itself instead of borrowing a human's account.

This skill covers the **CLI**. If an `anima` MCP server is connected, prefer it
(see the `anima` skill). Use the CLI when you want shell commands, scripting, or
CI.

## Install and authenticate

```bash
npm install -g @anima-labs/cli   # provides both `anima` and `am`
anima onboard                    # guided setup
```

`anima auth login` is browser-based. Run it in the background: it prints a
verification URL immediately, then keeps polling while the user approves.
**Always show the full URL in clear text.**

```bash
anima auth whoami                # confirm org, agent, tier
```

Non-interactive (CI, servers):

```bash
anima auth login --api-key "$ANIMA_API_KEY"
```

## Output format

Commands default to **agent format** — compact JSON, low token cost. Errors go to
stderr as `{"status":"error","message":"..."}` with exit code 1.

```bash
anima --human agent list         # tables and colour, for people
anima --format yaml email list   # yaml | jsonl | md | json
```

## Give an agent an identity

```bash
# Create the identity
anima identity create --name "Support Bot" --slug support-bot

# It now has an inbox — send from it
anima email send --agent <agent-id> \
  --to user@example.com \
  --subject "Hello from my agent" \
  --body "I have my own inbox now."

# Read what arrives
anima email list --agent <agent-id>
anima email get <message-id>
```

## Add a phone number

```bash
anima phone search --country US --limit 5
anima phone provision --agent <agent-id> --country US
anima phone list --agent <agent-id>

anima phone send-sms --agent <agent-id> --to +15551234567 --body "Agent here."
```

Voice, with transcripts:

```bash
anima voice place --agent <agent-id> --to +15551234567
anima voice transcript <call-id>
```

Note: numbers send and receive SMS and voice. They are geographic US numbers, so
treat any third-party signup gate that requires a mobile line as unverified.

## Use a credential without the model seeing it

The vault is the part that makes an agent self-sufficient rather than a
form-filler. The secret is injected at the point of use — it never enters the
context window, the logs, or a trace.

```bash
anima vault provision --agent <agent-id>
anima vault store --agent <agent-id> --label "acme-portal" \
  --username ops@example.com --password "$SECRET"

anima vault get --agent <agent-id> --label "acme-portal"   # metadata, not the value
anima vault totp --agent <agent-id> --label "acme-portal"  # current TOTP code
```

## React to inbound events

```bash
anima webhook set --agent <agent-id> --url https://example.com/hook \
  --events email.received,sms.received
anima webhook test --agent <agent-id>
```

## Common flags

| Flag | Purpose |
|---|---|
| `--agent <id>` | Which identity acts. Defaults to the configured one. |
| `--token <key>` | Override stored auth for one command. |
| `--test` | Server uses fixtures — no real email/SMS is sent. |
| `--human` | Tables and colour instead of JSON. |

Use `--test` when demonstrating a flow you do not want to actually deliver.

## Troubleshooting

- `command not found: anima` — the npm global bin is not on `PATH`; try
  `npx @anima-labs/cli` or re-run `npm install -g @anima-labs/cli`.
- Phone or voice unavailable — the free tier has no phone; those commands need a
  paid plan. `anima auth whoami` shows the tier.
- Vault reads refused — vault provisioning is owner-gated; run
  `anima request vault` to ask the human to approve in the console.

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
