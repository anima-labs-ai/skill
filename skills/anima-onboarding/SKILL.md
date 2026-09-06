---
name: anima-onboarding
description: |
  Set an AI agent up with its own Anima identity from scratch in about a minute — install, provision an email inbox, clear the owner verification gate, and prove it works by sending real mail. Use when the user says "set up Anima", "get me started with Anima", "give my agent an identity", "onboard my agent", "I just installed Anima, now what", or when an agent is reading useanima.sh/skill.md and needs the first-run path rather than the full tool reference.
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

The shortest path from nothing to an agent that can send real email from an
address it owns. About a minute, no credit card.

For the full tool reference see `anima`. For a specific language see
`anima-cli`, `anima-ts`, `anima-python` or `anima-go`. To connect the hosted
server instead of installing anything, see `anima-mcp`.

## 1. Install

```bash
npm install -g @anima-labs/cli
```

Installs both `anima` and `am` — the same binary. If a global install is
awkward, `npx @anima-labs/cli` works for every command below.

## 2. Provision

```bash
anima init
```

Provisions a fresh agent with an inbox. In CI or any non-interactive context:

```bash
anima init --non-interactive --api-key "$ANIMA_API_KEY"
```

Confirm what you got:

```bash
anima auth whoami --human
```

## 3. Clear the verification gate

Full send capability unlocks only after the agent's **owner** confirms. Anima
emails them a 6-digit code:

```bash
anima verify <code>
```

Run it bare (`anima verify`) to be prompted for the code.

Two things matter here. The human must actually approve — an unverified
identity exists but cannot send freely, and that gate is the product working,
not an obstacle to route around. And if a verification URL is printed, **show
it in full, in clear text**; never shorten or summarise it, because the person
approving needs to see exactly where they are going.

## 4. Prove it works

Send real mail from the agent's own address:

```bash
anima email send --agent <agent-id> \
  --to human@example.com \
  --subject "My agent has its own inbox" \
  --body "Sent from an address that belongs to the agent, not to you."
```

Then read what comes back:

```bash
anima email list --agent <agent-id>
```

That round trip is the whole thesis in one step: mail addressed to the agent
arrives at the agent, not in a human's inbox behind a filter rule.

Rehearsing, or running in CI? Add `--test` to any command and the server uses
fixtures — nothing real is sent:

```bash
anima email send --test --agent <agent-id> --to human@example.com \
  --subject "Dry run" --body "Nothing left the building."
```

## 5. Take the tour, or go further

```bash
anima onboard                        # guided tour: capabilities, demos, MCP install
anima demo                           # local email walkthrough, nothing sent
anima doctor                         # health check: config, network, auth, MCP
```

```bash
anima phone provision --agent <agent-id> --country US   # paid plan
anima vault provision --agent <agent-id>                # owner-approved
anima setup-mcp                                         # wire into your harness
```

Phone, SMS and voice need a paid plan. `anima auth whoami` shows the tier if a
command is refused.

## Doing this without the CLI

Any MCP-aware harness can onboard itself. Point it at the skill and it runs the
above on its own:

```
Read useanima.sh/skill.md and get me set up with Anima
```

Works in Claude Code, Codex, Cursor, GrokBot, Hermes, OpenClaw and Windsurf.

## If something fails

| Symptom | Cause |
|---|---|
| `command not found: anima` | npm global bin not on `PATH` — use `npx @anima-labs/cli` |
| Send refused, unverified | Owner has not confirmed — run `anima verify <code>` |
| Phone commands unavailable | Free tier has no phone; check `anima auth whoami` |
| Vault refused | Provisioning is owner-gated — `anima request vault --reason "..."` |
| Anything else | `anima doctor` |

Free tier includes email, vault and MCP, no credit card.
Docs: <https://docs.useanima.sh>
