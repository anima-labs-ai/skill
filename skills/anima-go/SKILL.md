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
	"os"

	anima "github.com/anima-labs-ai/go"
)

func main() {
	client := anima.NewClient(os.Getenv("ANIMA_API_KEY")) // never hardcode
	ctx := context.Background()
	_ = client
	_ = ctx
}
```

An agent key (`ak_…`) scopes to one identity; a master key (`mk_…`) administers
the org. Services hang off the client: `client.Agents`, `client.Messages`,
`client.Emails`, `client.Phones`, `client.Vault`, `client.Webhooks`.

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

page, err := client.Emails.List(ctx, &anima.EmailListParams{AgentID: agent.ID})
```

Replies thread back to the agent that sent them rather than a shared human
mailbox — which is what makes "which agent did this?" answerable later. Pass
`InReplyTo` to keep a reply in its thread.

Large result sets have an auto-paging form so you do not hand-roll cursors:

```go
it := client.Emails.ListAutoPaging(&anima.EmailListParams{AgentID: agent.ID})
for it.Next(ctx) {
	m := it.Current()
	_ = m
}
if err := it.Err(); err != nil {
	return err
}
```

## Phone — SMS and voice

```go
number, err := client.Phones.Provision(ctx, anima.ProvisionPhoneParams{
	AgentID:     agent.ID,
	CountryCode: "US",
})

_, err = client.Messages.SendSMS(ctx, anima.SendSMSParams{
	AgentID: agent.ID,
	To:      "+15551234567",
	Body:    "Agent here.",
})
```

SMS goes through `client.Messages`, not `client.Phones` — the phone service
provisions and manages numbers, the message service sends. Numbers send and
receive SMS and voice. They are geographic US lines, so do not promise they
clear third-party signup gates that check line type.

## Vault — use a secret without reading it

```go
_, err = client.Vault.Provision(ctx, agent.ID)

cred, err := client.Vault.CreateCredential(ctx, anima.CreateVaultCredentialParams{
	AgentID: agent.ID,
	Type:    anima.CredentialTypeLogin,
	Name:    "acme-portal",
	Login: &anima.VaultLoginData{
		Username: "ops@example.com",
		Password: os.Getenv("ACME_PASSWORD"),
	},
})
```

Stronger: have the vault generate the password so it never exists in your
process, your environment, or the model's context. It is stored and never
returned — the response carries only the masked credential.

```go
cred, err := client.Vault.CreateCredential(ctx, anima.CreateVaultCredentialParams{
	AgentID:          agent.ID,
	Type:             anima.CredentialTypeLogin,
	Name:             "acme-portal",
	Login:            &anima.VaultLoginData{Username: "ops@example.com"},
	GeneratePassword: &anima.GeneratePasswordParams{Length: 32},
})
```

`GeneratePassword` is mutually exclusive with `Login.Password` — set one.

Read back by **credential ID**, not by name:

```go
c, err := client.Vault.GetCredential(ctx, cred.ID)
list, err := client.Vault.ListCredentials(ctx, anima.ListVaultCredentialsParams{
	AgentID: agent.ID,
})
```

Provisioning is owner-gated. If it is refused, ask through
`client.ProvisioningRequests` rather than retrying.

## Context and timeouts

Every call takes a `context.Context`. Give network calls a deadline so a hung
provider cannot stall an agent loop:

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

## Errors

Errors unwrap to `*anima.APIError`, carrying `Status`, `Code`, `Message` and —
on a 429 — `RetryAfter` in seconds. Handle what you can act on; let the rest
surface:

```go
var apiErr *anima.APIError
if errors.As(err, &apiErr) && apiErr.Code == "RATE_LIMIT" {
	time.Sleep(time.Duration(apiErr.RetryAfter) * time.Second)
}
```

Free tier: no credit card. Docs: <https://docs.useanima.sh>
