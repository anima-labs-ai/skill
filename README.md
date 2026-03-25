# @anima-labs/skill

Installable Claude Code skill package for operating Anima Labs MCP tools, CLI workflows, and API-connected automations.

## Contents

- `SKILL.md` comprehensive operational guidance
- `templates/claude-desktop.json` example Claude Desktop MCP config
- `templates/cursor-mcp.json` example Cursor MCP config
- `templates/env.example` environment template

## Install

```bash
bun add @anima-labs/skill
```

or from source:

```bash
cd skill
bun install
```

## Use

1. Copy one template from `templates/` into your MCP client config.
2. Set environment variables from `templates/env.example`.
3. Read and apply `SKILL.md` recipes and tool reference.

## Related packages

- MCP server: `@anima-labs/mcp`
- CLI: `@anima-labs/cli`

## Validate package

```bash
cd packages/skill
bun test
```
