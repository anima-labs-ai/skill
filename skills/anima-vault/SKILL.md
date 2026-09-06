---
name: anima-vault
description: |
  Let an AI agent log in and act using a credential it never sees — the Anima vault stores secrets encrypted and injects them at the point of use, so passwords and TOTP codes stay out of the model's context window, logs and traces. Use when the user says "my agent needs to log in", "store a password for my agent", "the agent needs 2FA", "don't put the API key in the prompt", "inject credentials", or asks how an agent can authenticate somewhere without being handed the secret.
allowed-tools:
  - Bash(anima:*)
  - Bash(am:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
user-invocable: true
---

# Anima Vault — let an agent use a secret without reading it

An agent that needs to log somewhere has two bad options and one good one.

**Paste the password into the prompt.** It is now in the context window, and in
every log, trace and eval dataset that context touches. Rotating it later does
not un-write those.

**Have a human do the login.** Then it is not an autonomous agent, it is a
form-filler with extra steps.

**Or store it in the vault and let the agent use it.** The secret is encrypted
at rest and injected at the point of use. The model never receives the value.

## Store a credential

```bash
anima vault provision --agent <agent-id>          # one-time, owner-approved

anima vault store --agent <agent-id> \
  --label "acme-portal" \
  --username "ops@example.com" \
  --password "$ACME_PASSWORD"
```

Pass the secret from the environment, never as a literal — a shell literal ends
up in history, and in whatever transcript the agent is writing.

## Use it

```bash
anima vault list --agent <agent-id>               # labels and metadata only
anima vault get --agent <agent-id> --label acme-portal
anima vault totp --agent <agent-id> --label acme-portal
```

`get` returns metadata by default. The point of the vault is that reading the
raw value is the exception, not the workflow — prefer injection at use.

## Two-factor

Store the TOTP seed alongside the credential and the agent can complete 2FA on
its own:

```bash
anima vault store --agent <agent-id> --label acme-portal \
  --username ops@example.com --password "$ACME_PASSWORD" --totp-secret "$ACME_TOTP"

anima vault totp --agent <agent-id> --label acme-portal   # current 6-digit code
```

## Ownership and approval

Vault provisioning is **owner-gated** — the human approves in the console, not
the agent. If a call is refused with a precondition error, ask rather than retry:

```bash
anima request vault --agent <agent-id>
```

That is the design: the agent gets the outcome, the human keeps the authority.

## What this is not

It is not a password manager for people, and it is not a payments product.
Anima issues no cards and moves no money. A human holds spend authority; the
vault only lets an agent authenticate somewhere without being handed the secret
in plain text.

## Why it matters for audit

Every vault use carries a correlation ID back to the human who authorized it,
alongside the agent's email, SMS and voice activity. When someone later asks
"which agent logged into that portal, and who said it could?", the trail exists.

Free tier includes 3 vaults and 10 credentials, no credit card.
Docs: <https://docs.useanima.sh>
