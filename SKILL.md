# Anima MCP + CLI Skill

Production skill for Claude Code and compatible assistants to operate Anima end-to-end: identity, email, phone/SMS, cards, vault, addresses, webhooks, security, browser checkout automation, and x402 fetches.

## Quick Start

Use one command to initialize auth/config and install MCP wiring:

```bash
bunx @anima-labs/cli init --non-interactive --api-key "$ANIMA_API_KEY" --api-url "${ANIMA_API_URL:-http://127.0.0.1:3100}" && bunx @anima-labs/cli setup-mcp install --all --api-key "$ANIMA_API_KEY"
```

Local MCP server launch modes:

```bash
bun run /path/to/packages/mcp/src/index.ts
bun run /path/to/packages/mcp/src/index.ts --http --port=8014
```

## Architecture Overview

Anima has four cooperating surfaces:

1. API (`apps/api`) is the source of truth for organizations, agents, messaging, cards, vault, and policy.
2. MCP server (`@anima-labs/mcp`, entry: `packages/mcp/src/index.ts`) exposes tools/resources to AI clients.
3. CLI (`@anima-labs/cli`, binary `anima`) handles auth, setup, and operator workflows.
4. Extension integration enables browser checkout tools via MCP (`browser_*`).

Runtime flow:

- AI client calls MCP tool.
- MCP tool validates input and permissions.
- MCP forwards to Anima API.
- Response returns as structured tool output.

Key resources:

- `anima://inbox`
- `anima://agent-info`

## MCP Server Setup

### Required environment

- `ANIMA_API_URL` default: `http://127.0.0.1:3100`
- `ANIMA_API_KEY` required for agent access (`ak_...`)
- `ANIMA_MASTER_KEY` optional for privileged actions (`mk_...`)

Also accepted key formats for HTTP auth: `ak_`, `mk_`, `sk_live_`, `sk_test_`.

### Stdio mode

```bash
bun run /path/to/packages/mcp/src/index.ts
```

### HTTP mode

```bash
bun run /path/to/packages/mcp/src/index.ts --http --port=8014
```

HTTP endpoint: `http://localhost:8014/mcp`

### Claude Desktop config

```json
{
  "mcpServers": {
    "anima": {
      "command": "bun",
      "args": ["run", "/path/to/packages/mcp/src/index.ts"],
      "env": {
        "ANIMA_API_URL": "http://127.0.0.1:3100",
        "ANIMA_API_KEY": "ak_your_agent_key",
        "ANIMA_MASTER_KEY": "mk_your_master_key"
      }
    }
  }
}
```

### Cursor config

Local stdio:

```json
{
  "mcpServers": {
    "anima": {
      "command": "bun",
      "args": ["run", "/path/to/packages/mcp/src/index.ts"],
      "env": {
        "ANIMA_API_URL": "http://127.0.0.1:3100",
        "ANIMA_API_KEY": "ak_your_agent_key",
        "ANIMA_MASTER_KEY": "mk_your_master_key"
      }
    }
  }
}
```

Remote HTTP:

```json
{
  "mcpServers": {
    "anima": {
      "url": "http://localhost:8014/mcp",
      "headers": {
        "Authorization": "Bearer ak_your_agent_key"
      }
    }
  }
}
```

## Complete Tool Reference

Master Key column indicates whether privileged key access is required.

### Organization (6)

| Tool | Description | Master Key |
|---|---|---|
| `org_create` | Create a new organization tenant. | ✅ |
| `org_get` | Fetch organization details by ID. | ❌ |
| `org_update` | Update organization name or metadata. | ❌ |
| `org_delete` | Permanently delete an organization. | ✅ |
| `org_rotate_key` | Rotate organization API key material. | ✅ |
| `org_list` | List organizations with pagination. | ✅ |

### Agent (6)

| Tool | Description | Master Key |
|---|---|---|
| `agent_create` | Create an agent identity. | ❌ |
| `agent_get` | Get a single agent by ID. | ❌ |
| `agent_list` | List available agents. | ❌ |
| `agent_update` | Update agent profile fields. | ❌ |
| `agent_delete` | Delete an agent identity. | ❌ |
| `agent_rotate_key` | Rotate an agent API key. | ❌ |

### Email (24)

| Tool | Description | Master Key |
|---|---|---|
| `email_send` | Send an outbound email. | ❌ |
| `email_get` | Get one email by ID. | ❌ |
| `email_list` | List mailbox emails with paging. | ❌ |
| `email_reply` | Reply in-thread to an email. | ✅ |
| `email_forward` | Forward an existing email. | ❌ |
| `email_search` | Search email/message content. | ❌ |
| `inbox_digest` | Build compact inbox summary. | ❌ |
| `email_mark_read` | Mark a message as read. | ❌ |
| `email_mark_unread` | Mark a message as unread. | ❌ |
| `email_move` | Move a message to folder. | ❌ |
| `email_delete` | Delete one email by ID. | ❌ |
| `batch_mark_read` | Mark many emails read. | ❌ |
| `batch_mark_unread` | Mark many emails unread. | ❌ |
| `batch_delete` | Delete many emails in one call. | ❌ |
| `batch_move` | Move many emails in one call. | ❌ |
| `manage_folders` | List/create mailbox folders. | ❌ |
| `manage_contacts` | List/create/delete contacts. | ❌ |
| `manage_templates` | List/create/delete templates. | ❌ |
| `template_send` | Send email from template. | ❌ |
| `setup_email_domain` | Convenience domain setup helper. | ✅ |
| `send_test_email` | Send a test verification email. | ✅ |
| `manage_spam` | List/report/unmark spam. | ❌ |
| `manage_pending` | Approve/reject pending messages. | ❌ |
| `wait_for_email` | Poll until matching email arrives. | ❌ |

### Domain (7)

| Tool | Description | Master Key |
|---|---|---|
| `domain_add` | Add a sender domain. | ✅ |
| `domain_verify` | Trigger DNS verification. | ✅ |
| `domain_get` | Inspect one domain. | ❌ |
| `domain_list` | List configured domains. | ❌ |
| `domain_delete` | Remove a domain. | ✅ |
| `domain_dns_records` | Get required DNS records. | ❌ |
| `domain_deliverability` | Check deliverability diagnostics. | ❌ |

### Phone (6)

| Tool | Description | Master Key |
|---|---|---|
| `phone_search` | Search available phone inventory. | ❌ |
| `phone_provision` | Provision a phone number. | ✅ |
| `phone_release` | Release a phone number. | ✅ |
| `phone_list` | List provisioned numbers. | ❌ |
| `phone_send_sms` | Send outbound SMS. | ❌ |
| `phone_status` | Get status/capabilities summary. | ❌ |

### Message (9)

| Tool | Description | Master Key |
|---|---|---|
| `message_agent` | Send to agent by name. | ❌ |
| `message_get` | Fetch one message by ID. | ❌ |
| `message_get_attachment` | Get attachment download URL. | ❌ |
| `message_list` | List messages with filters. | ❌ |
| `message_search` | Full-text message search. | ❌ |
| `message_semantic_search` | Embedding-based semantic search. | ❌ |
| `message_send_email` | Send email through unified message API. | ❌ |
| `message_send_sms` | Send SMS through unified message API. | ❌ |
| `message_upload_attachment` | Upload attachment to message. | ❌ |

### Cards (18)

| Tool | Description | Master Key |
|---|---|---|
| `create_card` | Create a virtual card. | ❌ |
| `get_card` | Retrieve one card by ID. | ❌ |
| `list_cards` | List cards for current agent. | ❌ |
| `freeze_card` | Freeze card to block spend. | ❌ |
| `unfreeze_card` | Re-activate frozen card. | ❌ |
| `create_cardholder` | Create a cardholder profile. | ❌ |
| `get_cardholder` | Get cardholder by ID. | ❌ |
| `list_cardholders` | List cardholders with paging. | ❌ |
| `delete_cardholder` | Delete a cardholder record. | ❌ |
| `update_cardholder` | Update cardholder profile fields. | ❌ |
| `create_spending_policy` | Create card policy rule. | ❌ |
| `list_spending_policies` | List policies for card. | ❌ |
| `delete_spending_policy` | Delete a policy by ID. | ❌ |
| `approve_authorization` | Approve pending authorization decision. | ❌ |
| `decline_authorization` | Decline pending authorization decision. | ❌ |
| `get_spending_summary` | Get normalized spend vs limit summary. | ❌ |
| `get_transactions` | List card transactions. | ❌ |
| `list_approvals` | List authorization approvals. | ❌ |

### Vault (10)

| Tool | Description | Master Key |
|---|---|---|
| `vault_provision` | Provision vault for an agent. | ✅ |
| `vault_status` | Check vault readiness/status. | ❌ |
| `vault_deprovision` | Remove agent vault assignment. | ✅ |
| `vault_create_credential` | Store new vault credential. | ❌ |
| `vault_get_credential` | Fetch credential by ID. | ❌ |
| `vault_list_credentials` | List vault credentials. | ❌ |
| `vault_update_credential` | Update credential fields. | ❌ |
| `vault_delete_credential` | Delete credential by ID. | ❌ |
| `vault_generate_password` | Generate secure password. | ❌ |
| `vault_get_totp` | Get live TOTP code. | ❌ |

### Webhook (7)

| Tool | Description | Master Key |
|---|---|---|
| `webhook_create` | Create event webhook endpoint. | ❌ |
| `webhook_get` | Get webhook details. | ❌ |
| `webhook_update` | Update URL/events/status. | ❌ |
| `webhook_delete` | Delete webhook endpoint. | ❌ |
| `webhook_list` | List webhooks with paging. | ❌ |
| `webhook_test` | Send test event delivery. | ❌ |
| `webhook_list_deliveries` | List webhook delivery attempts. | ❌ |

### Security (5)

| Tool | Description | Master Key |
|---|---|---|
| `security_approve` | Approve/reject pending security-gated message. | ✅ |
| `security_get_policy` | Fetch active agent security policy. | ❌ |
| `security_list_events` | List security events. | ❌ |
| `security_scan_content` | Dry-run content risk scan. | ❌ |
| `security_update_policy` | Update enforcement policy settings. | ✅ |

### Utility (14+)

| Tool | Description | Master Key |
|---|---|---|
| `whoami` | Show active credential identity. | ❌ |
| `check_health` | Check API service health. | ❌ |
| `list_agents` | Utility list of agents. | ❌ |
| `manage_pending` | Review pending approval queue. | ❌ |
| `check_followups` | Drain queued follow-up reminders. | ❌ |
| `message_agent` | Message another agent by name. | ❌ |
| `check_messages` | Check inbound message queue. | ❌ |
| `wait_for_email` | Wait for inbound email match. | ❌ |
| `call_agent` | Send request and wait reply. | ❌ |
| `update_metadata` | Patch current agent metadata. | ❌ |
| `setup_email_domain` | Domain onboarding convenience action. | ✅ |
| `send_test_email` | Send setup verification email. | ✅ |
| `manage_spam` | Spam triage operations. | ❌ |
| `check_tasks` | Query task-assignment messages. | ❌ |
| `claim_task` | Claim queued task for execution. | ❌ |
| `submit_result` | Submit completion result payload. | ❌ |
| `assign_task` | Assign task to target agent. | ❌ |
| `cleanup_agents` | Cleanup stale/retired agents. | ❌ |
| `conversation_search` | Discover related message threads by topic. | ❌ |
| `manage_rules` | Manage mailbox/message rules. | ❌ |
| `batch_read` | Mark message sets as read. | ❌ |
| `manage_scheduled` | Manage scheduled sends/actions. | ❌ |
| `manage_signatures` | Manage sender signatures. | ❌ |
| `manage_tags` | Manage message tagging taxonomy. | ❌ |

### Browser Payments (4)

| Tool | Description | Master Key |
|---|---|---|
| `browser_detect_checkout` | Detect checkout forms in browser context. | ❌ |
| `browser_fill_card` | Fill card fields into checkout. | ❌ |
| `browser_fill_address` | Fill billing/shipping address fields. | ❌ |
| `browser_pay_checkout` | Execute checkout payment flow. | ❌ |

### x402 (1)

| Tool | Description | Master Key |
|---|---|---|
| `x402_fetch` | Fetch x402-protected URL with settlement flow. | ❌ |

### Address (6)

| Tool | Description | Master Key |
|---|---|---|
| `create_address` | Create a billing, shipping, mailing, or registered address for an agent. | ❌ |
| `list_addresses` | List all addresses for an agent, optionally filtered by type. | ❌ |
| `get_address` | Get a specific address by ID. | ❌ |
| `update_address` | Update an existing address. | ❌ |
| `delete_address` | Delete an address. | ❌ |
| `validate_address` | Validate and standardize an address via USPS/provider. | ❌ |

## CLI Reference

Package: `@anima-labs/cli`  
Binaries: `am`, `anima`

Command groups:

- `auth`
- `identity`
- `email`
- `phone`
- `card`
- `vault`
- `config`
- `setup-mcp`
- `extension`
- `admin`
- `init`

Core examples:

```bash
anima auth login --api-key ak_xxx
anima identity create --name worker-1
anima email send --to ops@example.com --subject "Hello" --text "Hi"
anima setup-mcp install --all
anima extension status
```

## Workflow Recipes

### 1) New agent identity (auth → create agent → provision email)

1. `anima auth login --api-key ak_xxx`
2. Call `agent_create` with name + metadata.
3. Validate with `agent_get`.
4. Verify sender with `whoami` and `anima://agent-info`.

### 2) Sending and managing email

1. Send: `email_send`.
2. List mailbox: `email_list` or `inbox_digest`.
3. Triage: `email_mark_read`, `email_move`, `manage_spam`.
4. Bulk actions: `batch_mark_read`, `batch_move`, `batch_delete`.

### 3) Agent-to-agent communication

1. Discover targets via `list_agents`.
2. Send direct message with `message_agent`.
3. For sync request/response use `call_agent`.
4. Poll inbound with `check_messages` or `wait_for_email`.

### 4) Card creation with spending policies

1. Create cardholder (`create_cardholder`) if needed.
2. Create card (`create_card`) with limits.
3. Add controls (`create_spending_policy`).
4. Review spend via `get_spending_summary` and `get_transactions`.
5. Handle approvals via `list_approvals`, `approve_authorization`, `decline_authorization`.

### 5) Vault secret management

1. Provision vault with `vault_provision`.
2. Store secret with `vault_create_credential`.
3. Rotate using `vault_generate_password` + `vault_update_credential`.
4. Retrieve one-time code via `vault_get_totp`.

### 6) Domain setup and verification

1. Add domain using `domain_add`.
2. Fetch DNS entries via `domain_dns_records`.
3. Configure DNS at provider.
4. Verify with `domain_verify`.
5. Check readiness with `domain_deliverability`.

### 7) Webhook configuration

1. Create endpoint with `webhook_create`.
2. Validate using `webhook_test`.
3. Inspect failures via `webhook_list_deliveries`.
4. Rotate destination with `webhook_update`.

### 8) Browser payment automation

1. Detect checkout: `browser_detect_checkout`.
2. Fill data: `browser_fill_card`, `browser_fill_address`.
3. Execute: `browser_pay_checkout`.
4. Audit card activity with `get_transactions`.

### 9) Address management for purchasing agents

1. Create billing address: `create_address` with type `BILLING`.
2. Create shipping address: `create_address` with type `SHIPPING`.
3. Validate: `validate_address` — standardizes via USPS/provider.
4. Card creation auto-populates billing address from agent's primary.
5. Browser checkout auto-fills shipping from `browser_fill_address`.
6. List all addresses: `list_addresses`.

### 10) x402 protected fetches

1. Call `x402_fetch` with URL.
2. Set `budget_limit_cents` for spend guardrails.
3. Use `sandbox: true` for dry runs.
4. Inspect `paid`, `settlement`, and response body.

## Troubleshooting

- Missing auth header in HTTP mode: include `Authorization: Bearer <key>`.
- Invalid key format: key must start with `ak_`, `mk_`, `sk_live_`, or `sk_test_`.
- Privileged tool denied: set `ANIMA_MASTER_KEY` for master-key tools.
- Connection refused: verify `ANIMA_API_URL` and API availability (`check_health`).
- HTTP MCP unreachable: ensure `--http --port=8014` is running and URL ends with `/mcp`.
- Tool timeouts on polling flows: reduce filters, increase timeout, verify inbox traffic.
- Empty agent identity details: verify `whoami` and that API key belongs to intended org.

## Best Practices

- Use agent keys (`ak_`) for normal automation and master keys only for privileged operations.
- Keep separate keys per environment and rotate keys regularly.
- Pre-scan risky content with `security_scan_content` before send.
- Prefer idempotent workflow markers in metadata (request IDs, job IDs, trace IDs).
- For retries, make operations safe by checking existing state first (`*_get`, `*_list` before create/delete).
- Use least-privilege setup: only mount master key where required.
- Log tool calls and responses with correlation IDs for auditability.
- For high-volume email workflows, use batch operations and digest/list checks instead of per-message loops.
