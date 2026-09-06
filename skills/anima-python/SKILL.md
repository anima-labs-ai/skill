---
name: anima-python
description: |
  Give an AI agent its own identity and communication channels from Python using the Anima SDK (`pip install anima-labs`) — a real email inbox, a US phone number for SMS and voice, and an encrypted credential vault the agent can use without exposing secrets to the model. Use when the user is writing Python and says "add Anima", "give my agent an email", "send an email from my agent", "provision a phone number", "receive SMS", or "store a credential for my agent".
allowed-tools:
  - Bash(pip:*)
  - Bash(uv:*)
  - Bash(python:*)
  - Bash(python3:*)
version: 0.1.0
metadata:
  author: anima-labs
  homepage: https://useanima.sh
  docs: https://docs.useanima.sh
  package: anima-labs
user-invocable: true
---

# Anima for Python — identity and communication for agents

Anima is the identity and communication layer for AI agents. Each identity owns
an email inbox, a US phone number for SMS and voice, and an encrypted vault — so
the agent acts as itself rather than on a human's account.

This skill covers the **Python SDK**. For shell usage see `anima-cli`; for the
full tool reference see `anima`.

## Install

```bash
pip install anima-labs        # or: uv add anima-labs
```

## Client

```python
import os
from anima import Anima

client = Anima(api_key=os.environ["ANIMA_API_KEY"])   # never hardcode
```

An agent key (`ak_…`) scopes to one identity; a master key (`mk_…`) can
administer the org.

## Create an identity

```python
agent = client.agents.create(
    org_id=os.environ["ANIMA_ORG_ID"],
    name="Support Bot",
    slug="support-bot",
)
```

## Email — the agent's own inbox

```python
message = client.messages.send_email(
    agent_id=agent.id,
    to=["user@example.com"],
    subject="Hello from my agent",
    body="I have my own inbox now.",
)

inbox = client.messages.list(agent_id=agent.id)
```

Replies thread back to the agent that sent them rather than a shared human
mailbox — which is what makes "which agent did this?" answerable later.

## Phone — SMS and voice

```python
number = client.phone.provision(agent_id=agent.id, country="US")

client.phone.send_sms(
    agent_id=agent.id,
    to="+15551234567",
    body="Agent here.",
)

call = client.phone.call(agent_id=agent.id, to="+15551234567")
transcript = client.phone.transcript(call_id=call.id)
```

Numbers send and receive SMS and voice. They are geographic US lines, so do not
promise that they clear third-party signup gates that require a mobile line.

## Vault — use a secret without reading it

This is what makes an agent autonomous rather than a form-filler. The credential
is injected at the point of use and never enters the model's context, your logs,
or a trace.

```python
client.vault.store(
    agent_id=agent.id,
    label="acme-portal",
    username="ops@example.com",
    password=os.environ["ACME_PASSWORD"],
)

cred = client.vault.get(agent_id=agent.id, label="acme-portal")   # metadata only
totp = client.vault.totp(agent_id=agent.id, label="acme-portal")
```

## Inbound events

```python
client.webhooks.set(
    agent_id=agent.id,
    url="https://example.com/hook",
    events=["email.received", "sms.received"],
)
```

Verify the signature on your endpoint before trusting a payload.

## Errors

Calls raise a typed exception carrying a `code` and HTTP `status`. Catch what you
can act on; let the rest fail loudly.

```python
from anima import AnimaError

try:
    client.messages.send_email(...)
except AnimaError as err:
    if err.code == "PLAN_LIMIT":
        ...        # upgrade or back off
    raise
```

## Testing without sending

Exercise a flow against fixtures — no real email or SMS leaves the system:

```python
client = Anima(
    api_key=os.environ["ANIMA_API_KEY"],
    default_headers={"X-Anima-Test-Mode": "1"},
)
```

Free tier: 3 identities, no credit card. Docs: <https://docs.useanima.sh>
