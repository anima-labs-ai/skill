---
name: anima
description: |
  Gives an AI agent a full identity — email inbox, phone number, voice, virtual card, encrypted vault, addresses, DID — and the tools to use them. Use when the user says "create an agent", "give my agent email", "issue a card", "send email as agent", "buy something on a website", "pay for an API", "fetch with x402", "store a secret in the vault", "set up a phone number", "approve a spend", or asks to spin up identity for an autonomous workflow. Use when the user asks to install or connect Anima.
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

Anima gives an autonomous agent a verified identity (email, phone, voice, card, vault, addresses, W3C DID) and the tools to act on it. Agents can sign up for SaaS, receive OTPs, take calls, pay for things, and store secrets — all gated by a unified policy engine.

> **Note (May 2026):** the spend-request lifecycle (`anima card spend-request *`), the MPP/SPT commands (`anima mpp pay`, `anima mpp decode`), and OAuth Connect (`connect.useanima.sh`) ship in **Wave 3** of the May 2026 release. They are documented here as the canonical agent-facing contract, but the CLI commands return "coming soon" until 3A-3M land. Track release: `anima auth whoami --human` will show CLI version; v0.6.0+ has Wave 3.

## Choosing how to call Anima

Anima ships an **MCP server** and a **standalone CLI**. Always prefer the MCP server when available — it avoids shell-parsing edge cases and is the intended integration path.

1. **Check for the MCP server first.** Look for an `anima` MCP server in your active MCP connections. If present, call its tools directly (e.g. `whoami`, `agent_create`, `email_send`, `create_card`, `x402_fetch`).
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
| `anima card create` | `mcp__anima__create_card` |
| `anima card list` | `mcp__anima__list_cards` |
| `anima card spend-request create` | `mcp__anima__spend_request_create` |
| `anima card spend-request retrieve` | `mcp__anima__spend_request_retrieve` |
| `anima card spend-request approve-url` | `mcp__anima__spend_request_request_approval` |
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

**IMPORTANT:** Run `auth login` and `spend-request create --request-approval` with `run_in_background=true` (or `TaskOutput(task_id, block: false)`). They emit JSON to stdout immediately, then keep running while polling for user action.

Agent-facing JSON contract:

- `auth login`: first object contains `verification_url` and `phrase`; final object contains the authentication result after the user approves
- `card spend-request create --request-approval`: returns the created spend request immediately with an `_next.command` polling hint
- `card spend-request retrieve <id> --interval <s>`: polls until the spend request reaches a terminal status (`approved`, `denied`, `expired`), then returns the terminal record. Exits non-zero with `code: "POLLING_TIMEOUT"` if `--timeout` or `--max-attempts` is reached
- `whoami`: returns identity payload with optional `update` field if a newer CLI version is available

For `auth login` and any approval polling, keep reading stdout until the process exits. For approval flows, present the `approval_url` to the user and start the `_next.command` polling immediately. The user MUST visit the verification or approval URL to continue. **Always show the full URL in clear text.**

## Core flow — buy something on a website

Copy this checklist and track progress.

- [ ] Step 1: Authenticate with Anima
- [ ] Step 2: Evaluate the merchant (determine credential type)
- [ ] Step 3: Create a spend request with the right credential type
- [ ] Step 4: Wait for cardholder approval (email + webhook + passkey for ≥$200)
- [ ] Step 5: Complete payment

### Step 1: Authenticate

```bash
anima auth whoami
```

If the response includes an `update` field, a newer version of the CLI is available — run the `update_command` from that field to upgrade before proceeding.

If not authenticated:

```bash
anima auth login --client-name "<agent-name>"
```

Replace `<agent-name>` with the name of your agent (e.g. `"Personal Assistant"`, `"Shopping Bot"`). This name appears in the cardholder's approval email so they recognise the request. **DO NOT PROCEED until the user is authenticated.**

### Step 2: Evaluate the merchant BEFORE creating a spend request

**CRITICAL** — before calling `card spend-request create` you must complete this checklist:

1. Understand how the merchant accepts payment. **Do NOT default to `card` credential type.** The merchant determines the credential type — you cannot know it without checking first. Skipping this step will produce a spend request with the wrong credential type.
2. Have the final total amount, inclusive of shipping, taxes, and any other costs. A short amount produces a request that the merchant will reject.
3. Have clear context on what the user is purchasing — sizes, colours, quantities, shipping options. The cardholder reads the `context` field when approving.

| What you see | Credential type | What to request |
|---|---|---|
| Credit card form / Stripe Elements / standard checkout | `card` (default) | Virtual card |
| HTTP 402 with `method="anima"` or `method="stripe"` in `WWW-Authenticate` | `shared_payment_token` | Shared payment token (SPT) |
| HTTP 402 with `method="x402"` (USDC settlement) | `x402` | x402 token |
| HTTP 402 without a supported method | not supported | Do not continue |

**For 402 responses:** the `WWW-Authenticate` header may contain multiple challenges (e.g. `tempo`, `stripe`, `anima`) in a single header value. Do not parse manually. Pass the full raw header to `mpp decode` and let it select the supported challenge:

```bash
anima mpp decode --challenge '<full-header>'
```

This validates the challenge, decodes the request payload, and returns the extracted `network_id` and decoded request JSON. Pass the full header exactly as received.

### Step 3: Create the spend request with the right credential type

```bash
anima card spend-request create \
  --card-id <card_id> \
  --amount <cents> \
  --context "<full-sentence explanation of what is being purchased and why>" \
  --merchant-name "<name>" \
  --merchant-url "<url>" \
  --line-item "name:<item>,unit_amount:<cents>,quantity:1" \
  --total "type:total,display_text:Total,amount:<cents>" \
  --request-approval
```

**`--line-item` keys:** `name` (required), `quantity`, `unit_amount`, `description`, `sku`, `url`, `image_url`, `product_url`. Repeatable for multiple items.

**`--total` keys:** `type` (required), `display_text` (required), `amount` (required). Repeatable (e.g. subtotal + shipping + total).

**Constraints:**

- `context` must be at least 100 characters
- `amount` must not exceed cardholder's per-transaction limit (default $500)
- `currency` must be a 3-letter ISO code (default `USD`)

**Test mode:** add `--test` to issue test-mode credentials. Useful for development without real charges.

### Step 4: Wait for approval

After creating with `--request-approval`, run the returned `_next.command` to poll for the terminal status. Do not proceed to payment while the request is `created` or `pending_approval`.

Approval channels (the cardholder picks one — they all resolve the same approval):

1. **Email magic-link** — the cardholder gets an email with `[Approve] [Decline]` buttons. Single-use signed URL, 15-min TTL.
2. **Passkey step-up** — for amounts ≥ $200 (configurable per cardholder), the approval page on `approve.useanima.sh` requires a passkey/WebAuthn second factor.
3. **Webhook** — if the cardholder's organisation has a webhook configured for `spend_request.pending_approval`, the integration may show approval UI in their own surface (Slack, dashboard, etc.).

If polling exits with `POLLING_TIMEOUT`, keep waiting or ask the user whether to continue polling. If they deny, ask what to do next.

### Step 5: Complete payment

**Card:** Run `anima card spend-request retrieve <id> --include card` to get the `card` object with `number`, `cvc`, `exp_month`, `exp_year`, `billing_address` (name, line1, line2, city, state, postal_code, country), and `valid_until` (unix timestamp — the card stops working after this time). Enter these into the merchant's checkout form, or use the MCP browser tools (`browser_detect_checkout`, `browser_fill_card`, `browser_fill_address`, `browser_pay_checkout`) via the Anima Chrome extension to fill checkout automatically.

**SPT with 402:** the SPT is one-time-use — if payment fails, you need a new spend request and new SPT.

```bash
anima mpp pay <url> \
  --spend-request-id <id> \
  --method POST \
  --data '{"amount":100}' \
  --header 'X-Custom: value'
```

`mpp pay` handles the full 402 flow: probes the URL, parses `WWW-Authenticate`, builds the `Authorization: Payment` credential using the SPT, and retries.

**x402 (USDC settlement):**

```bash
anima x402 fetch <url> --budget-limit-cents 500
```

Returns `paid`, `settlement`, and the response body. Pass `--sandbox` for dry-run.

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
  --events email.received,sms.received,spend_request.pending_approval
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

- **Treat card numbers, SPTs, and vault secrets extremely carefully** — they grant real spending power or system access. Never echo a raw card number into chat history; use ephemeral handles where the API supports them.
- **Mask card details when displaying to the user** — show the last four digits only unless the user explicitly requests the full number.
- **Respect `/agents.txt` and `/llms.txt` directives** on sites you browse. These files declare whether the site permits automated agent interactions. Ignoring them may violate the merchant's terms.
- **Avoid suspicious merchants** — phishing pages mimicking legitimate merchants can steal credentials. If anything about the page feels off (mismatched domain, unusual redirect, unexpected login prompt), stop and ask the user to verify.
- **Approval requests must include a clear `context`** — this is what the cardholder reads when deciding. A bad context produces a confused cardholder and a denied request.

## Errors

All errors are output as JSON with `code` and `message` fields, exit code 1.

| Error / symptom | Cause | Recovery |
|---|---|---|
| `verification_failed` from `mpp pay` | SPT was already consumed (one-time use) | Create a new spend request with `credential_type: "shared_payment_token"` — do not retry with the same spend request ID |
| `context_too_short` on `spend-request create` | `context` field is under 100 characters | Rewrite `context` as a full sentence explaining what is being purchased and why |
| `merchant_fields_forbidden_for_spt` | `merchant_name`/`merchant_url` are forbidden when `credential_type` is `shared_payment_token` | Remove both fields from the request; SPT flows identify the merchant via `network_id` instead |
| Command hangs indefinitely | `auth login` or `spend-request create --request-approval` ran synchronously | Always run these with `run_in_background=true` — they block until user action; synchronous execution freezes the agent |
| Spend request approved but payment fails immediately | Wrong `credential_type` for the merchant (e.g. `card` on a 402-only endpoint) | Go back to Step 2, re-evaluate, create a new spend request with the correct `credential_type` |
| Auth token expired mid-session | Token refresh failed during background polling | Re-authenticate with `auth login`, then retrieve the existing spend request or resume polling. Only create a new spend request if the original expired, was denied, or its SPT was already consumed |
| `step_up_required` on approval page | Amount ≥ cardholder's step-up threshold (default $200) | Cardholder completes WebAuthn/passkey on `approve.useanima.sh`. Wait for the polling command to return `approved` |
| `policy_denied` at authorisation | The card's spending policy (MCC, country, velocity, amount) blocked the transaction | Read `denied_reason` from the response. Adjust the request, or ask the user to update the policy via the `create_spending_policy` / `update_spending_policy` MCP tools (CLI wrappers ship in a later release) |
| 401 on any command | `ANIMA_API_KEY` missing/invalid, or stored token expired | Run `anima auth login` again, or set `ANIMA_API_KEY=ak_…` |
| 403 `scope_not_granted` | OAuth grant didn't include this scope | Re-authorize with the missing scope via the consent URL, or ask the org owner to expand the grant |

## Further docs

- Anima docs: https://docs.useanima.sh
- Anima skill manifest: https://useanima.sh/skill.md
- Anima `agents.txt`: https://useanima.sh/agent.txt
- Anima `llms.txt`: https://useanima.sh/llms.txt
- MPP/x402 protocol: https://docs.useanima.sh/protocols/mpp, https://docs.useanima.sh/protocols/x402
- Console (cardholder approvals + dashboards): https://console.useanima.sh
- Approval surface: https://approve.useanima.sh
- OAuth consent: https://connect.useanima.sh
- Support / questions: https://discord.gg/pY3GK59Z9E
