---
name: anima-onboarding
description: |
  Set an AI agent up with its own Anima identity from scratch in about a minute — sign up, verify with the human, provision an email inbox, and prove it works by sending real mail. Use when the user says "set up Anima", "get me started with Anima", "give my agent an identity", "onboard my agent", "I just installed Anima, now what", or when an agent is reading useanima.sh/skill.md and needs the first-run path rather than the full tool reference.
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

# Get an agent its own identity — first run

This is the shortest path from nothing to an agent that can send real email from
an address it owns. Roughly a minute. No credit card.

For the full tool reference see `anima`. For a specific language see
`anima-cli`, `anima-ts`, `anima-python` or `anima-go`.

## 1. Install

```bash
npm install -g @anima-labs/cli
```

Provides both `anima` and `am`. If a global install is awkward, `npx
@anima-labs/cli` works for every command below.

## 2. Sign up and verify

```bash
anima init
```

This provisions an org, an agent and an inbox, then emails the human a code to
confirm. Two things matter here:

- **The human must approve.** Anima is deliberately not fully self-serve for an
  agent acting alone: an unverified identity can be created, but full send
  capability unlocks only after a person confirms by email. That gate is the
  product working, not an obstacle to route around.
- **Show the verification URL in full, clear text** if one is printed. Never
  summarise or shorten it — the human needs to see exactly where they are going.

Confirm the result:

```bash
anima auth whoami --human
```

## 3. Prove it works

Send real mail from the agent's own address:

```bash
anima email send --agent <agent-id> \
  --to <the-human@example.com> \
  --subject "My agent has its own inbox" \
  --body "Sent from an address that belongs to the agent, not to you."
```

Then read what comes back:

```bash
anima email list --agent <agent-id>
```

That round trip is the whole thesis in one step: mail addressed to the agent
arrives at the agent, not in a human's Gmail behind a filter rule.

## 4. Optional — go further

```bash
anima phone provision --agent <agent-id> --country US   # paid tier
anima vault provision --agent <agent-id>                # owner-approved
```

Phone, SMS and voice need a paid plan; the free tier is email, vault and MCP.
`anima auth whoami` shows the tier if a command is refused.

## Doing this without the CLI

Any MCP-aware harness can onboard itself. Point it at the skill and it does the
above on its own:

```
Read useanima.sh/skill.md and get me set up with Anima
```

Works in Claude Code, Codex, Cursor, GrokBot, Hermes, OpenClaw and Windsurf. Or
connect the hosted MCP server directly — see `anima-mcp`.

## If something fails

| Symptom | Cause |
|---|---|
| `command not found: anima` | npm global bin not on `PATH` — use `npx @anima-labs/cli` |
| Send refused, unverified | The human has not confirmed the emailed code yet |
| Phone commands unavailable | Free tier has no phone; check `anima auth whoami` |
| Vault refused | Provisioning is owner-gated — run `anima request vault` |

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
