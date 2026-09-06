---
name: anima-go
description: |
  Give an AI agent its own identity and communication channels from Go using the Anima SDK (`go get github.com/anima-labs-ai/go`) — a real email inbox, a US phone number for SMS and voice, and an encrypted credential vault the agent can use without exposing secrets to the model. Use when the user is writing Go and says "add Anima", "give my agent an email", "send an email from my agent", "provision a phone number", "receive SMS", or "store a credential for my agent".
allowed-tools:
  - Bash(go:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
  module: github.com/anima-labs-ai/go
user-invocable: true
---

# Anima for Go — identity and communication for agents

Anima is the identity and communication layer for AI agents. Each identity owns
an email inbox, a US phone number for SMS and voice, and an encrypted vault — so
the agent acts as itself rather than on a human's account.

This skill covers the **Go SDK**. For shell usage see `anima-cli`; for the full
tool reference see `anima`.

## Install

```bash
go get github.com/anima-labs-ai/go
```

Requires Go 1.22 or later.

## Client

```go
package main

import (
    "context"
    "log"
    "os"

    anima "github.com/anima-labs-ai/go"
)

func main() {
    client := anima.NewClient(os.Getenv("ANIMA_API_KEY")) // never hardcode
    ctx := context.Background()
    _ = client
    _ = ctx
    _ = log.Println
}
```

An agent key (`ak_…`) scopes to one identity; a master key (`mk_…`) administers
the org.

## Create an identity

```go
agent, err := client.Agents.Create(ctx, anima.CreateAgentParams{
    OrgID: os.Getenv("ANIMA_ORG_ID"),
    Name:  "Support Bot",
    Slug:  "support-bot",
})
if err != nil {
    return fmt.Errorf("create agent: %w", err)
}
```

Wrap rather than swallow: an identity that silently failed to provision produces
confusing downstream failures on send.

## Email — the agent's own inbox

```go
msg, err := client.Messages.SendEmail(ctx, anima.SendEmailParams{
    AgentID: agent.ID,
    To:      []string{"user@example.com"},
    Subject: "Hello from my agent",
    Body:    "I have my own inbox now.",
})
```

Replies thread back to the agent that sent them rather than a shared human
mailbox — which is what makes "which agent did this?" answerable later.

## Phone — SMS and voice

```go
number, err := client.Phone.Provision(ctx, anima.ProvisionNumberParams{
    AgentID: agent.ID,
    Country: "US",
})

_, err = client.Phone.SendSMS(ctx, anima.SendSMSParams{
    AgentID: agent.ID,
    To:      "+15551234567",
    Body:    "Agent here.",
})
```

Numbers send and receive SMS and voice. They are geographic US lines, so do not
promise they clear third-party signup gates that check line type.

## Vault — use a secret without reading it

The credential is injected at the point of use. It never enters the model's
context, your logs, or a trace.

```go
_, err = client.Vault.Store(ctx, anima.StoreCredentialParams{
    AgentID:  agent.ID,
    Label:    "acme-portal",
    Username: "ops@example.com",
    Password: os.Getenv("ACME_PASSWORD"),
})

// Metadata only — the secret is not returned to your process by default.
cred, err := client.Vault.Get(ctx, agent.ID, "acme-portal")
```

## Context and timeouts

Every call takes a `context.Context`. Give network calls a deadline so a hung
provider cannot stall an agent loop:

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

## Errors

Errors carry a code and HTTP status. Handle what you can act on; let the rest
surface:

```go
var apiErr *anima.APIError
if errors.As(err, &apiErr) && apiErr.Code == "PLAN_LIMIT" {
    // upgrade or back off
}
```

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
