---
name: anima-ts
description: |
  Give an AI agent its own identity and communication channels from TypeScript or Node.js using the Anima SDK (`@anima-labs/sdk`) — a real email inbox, a US phone number for SMS and voice, and an encrypted credential vault the agent can use without exposing secrets to the model. Use when the user is writing TypeScript or JavaScript and says "add Anima", "give my agent an email", "send an email from my agent", "provision a phone number", "receive SMS", or "store a credential for my agent".
allowed-tools:
  - Bash(npm:*)
  - Bash(pnpm:*)
  - Bash(yarn:*)
  - Bash(bun:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
  package: "@anima-labs/sdk"
user-invocable: true
---

# Anima for TypeScript — identity and communication for agents

Anima is the identity and communication layer for AI agents. Each identity owns
an email inbox, a US phone number for SMS and voice, and an encrypted vault — so
the agent acts as itself rather than on a human's account.

This skill covers the **TypeScript/Node SDK**. For shell usage see `anima-cli`;
for the full tool reference see `anima`.

## Install

```bash
npm install @anima-labs/sdk     # or: pnpm add / yarn add / bun add
```

## Client

```ts
import { Anima } from "@anima-labs/sdk";

const anima = new Anima({
  apiKey: process.env.ANIMA_API_KEY!,   // never hardcode
});
```

Keep the key in the environment. An agent key (`ak_…`) scopes to one identity; a
master key (`mk_…`) can administer the org.

## Create an identity

```ts
const agent = await anima.agents.create({
  orgId: process.env.ANIMA_ORG_ID!,
  name: "Support Bot",
  slug: "support-bot",
});
```

## Email — the agent's own inbox

```ts
const message = await anima.messages.sendEmail({
  agentId: agent.id,
  to: ["user@example.com"],
  subject: "Hello from my agent",
  body: "I have my own inbox now.",
});

const inbox = await anima.messages.list({ agentId: agent.id });
```

Replies thread back to the agent that sent them, not to a shared human mailbox —
which is what makes "which agent did this?" answerable later.

## Phone — SMS and voice

```ts
const number = await anima.phone.provision({ agentId: agent.id, country: "US" });

await anima.phone.sendSms({
  agentId: agent.id,
  to: "+15551234567",
  body: "Agent here.",
});

const call = await anima.phone.call({ agentId: agent.id, to: "+15551234567" });
const transcript = await anima.phone.transcript({ callId: call.id });
```

Numbers send and receive SMS and voice. They are geographic US lines, so do not
promise that they clear third-party signup gates that require a mobile line.

## Vault — use a secret without reading it

This is the part that makes an agent autonomous rather than a form-filler. The
credential is injected at the point of use and never enters the model's context,
your logs, or a trace.

```ts
await anima.vault.store({
  agentId: agent.id,
  label: "acme-portal",
  username: "ops@example.com",
  password: process.env.ACME_PASSWORD!,
});

// Metadata only — the value is not returned to your process by default.
const cred = await anima.vault.get({ agentId: agent.id, label: "acme-portal" });
const totp = await anima.vault.totp({ agentId: agent.id, label: "acme-portal" });
```

## Inbound events

```ts
await anima.webhooks.set({
  agentId: agent.id,
  url: "https://example.com/hook",
  events: ["email.received", "sms.received"],
});
```

Verify the signature on your endpoint before trusting a payload.

## Errors

SDK calls reject with a typed error carrying a `code` and HTTP `status`. Handle
the ones you can act on and let the rest fail loudly:

```ts
try {
  await anima.messages.sendEmail({ /* … */ });
} catch (err: any) {
  if (err.code === "PLAN_LIMIT") { /* upgrade or back off */ }
  throw err;
}
```

## Testing without sending

Pass the test-mode header to exercise a flow with fixtures — no real email or
SMS leaves the system:

```ts
const anima = new Anima({
  apiKey: process.env.ANIMA_API_KEY!,
  headers: { "X-Anima-Test-Mode": "1" },
});
```

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
