import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const pkgDir = process.cwd();
const packageJsonPath = join(pkgDir, "package.json");
const skillPath = join(pkgDir, "SKILL.md");
const templatesDir = join(pkgDir, "templates");

function readText(path: string): string {
  return readFileSync(path, "utf-8");
}

describe("@anima-labs/skill package metadata", () => {
  it("has required package.json fields", () => {
    expect(existsSync(packageJsonPath)).toBe(true);
    const pkg = JSON.parse(readText(packageJsonPath)) as {
      name?: string;
      version?: string;
      description?: string;
      files?: string[];
      license?: string;
      author?: string;
      homepage?: string;
      repository?: { url?: string };
    };

    expect(pkg.name).toBe("@anima-labs/skill");
    expect(pkg.version).toBe("0.1.0");
    expect(pkg.description).toBe("Claude Code skill for Anima — AI agent identity and communication platform");
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain("SKILL.md");
    expect(pkg.files).toContain("README.md");
    expect(pkg.files).toContain("templates/");
    expect(pkg.license).toBe("MIT");
    expect(pkg.author).toBe("Anima Labs <support@useanima.sh>");
    expect(pkg.homepage).toBe("https://github.com/anima-labs-ai/skill");
    expect(pkg.repository?.url).toBe("https://github.com/anima-labs-ai/skill");
  });
});

describe("SKILL.md content coverage", () => {
  // SKILL.md was rewritten 2026-05-05 in the Stripe link-cli style: agent-facing
  // trigger phrases in frontmatter, MCP-first instruction with CLI fallback,
  // step-by-step core flow checklists, error-recovery matrix. The old section
  // headings (Quick Start / Architecture / etc) were intentionally replaced
  // with a flow-oriented structure. These tests validate the new shape.
  it("exists and includes required major sections", () => {
    expect(existsSync(skillPath)).toBe(true);
    const skill = readText(skillPath);

    const requiredSections = [
      "# Anima",
      "## Choosing how to call Anima",
      "## Output format",
      "## Running commands",
      "## Core flow",
      "## Important",
      "## Errors",
      "## Further docs",
    ];

    for (const section of requiredSections) {
      expect(skill.includes(section)).toBe(true);
    }
  });

  it("mentions every channel surface in the unified-identity wedge", () => {
    const skill = readText(skillPath);
    const surfaces = ["email", "phone", "voice", "vault", "address", "webhook", "MCP"];

    for (const surface of surfaces) {
      expect(skill.toLowerCase().includes(surface.toLowerCase())).toBe(true);
    }
  });

  it("steers only to MCP tools that actually exist (no phantom tools)", () => {
    // Competitive-parity spec E4: SKILL.md steered agents to x402_fetch,
    // mpp_pay, mpp_decode, auth_login, workspace_status, whoami — none of
    // which exist on either Anima MCP server. x402/MPP is excluded scope
    // (removed, not built), so the manifest must not resurrect any of them.
    const skill = readText(skillPath);
    const phantoms = [
      "x402_fetch",
      "mpp_pay",
      "mpp_decode",
      "auth_login",
      "workspace_status",
      "x402",
      "mpp",
    ];

    for (const phantom of phantoms) {
      expect(skill.toLowerCase().includes(phantom.toLowerCase())).toBe(false);
    }
    // `whoami` may only appear as the CLI command `anima auth whoami`,
    // never as a bare MCP tool reference.
    expect(skill.includes("`whoami`")).toBe(false);
  });

  it("templates point at published surfaces, not monorepo-local paths", () => {
    const claudeDesktop = readText(join(templatesDir, "claude-desktop.json"));
    const cursor = readText(join(templatesDir, "cursor-mcp.json"));
    const env = readText(join(templatesDir, "env.example"));

    // Old templates ran `bun run /path/to/packages/mcp/src/index.ts` against
    // http://127.0.0.1:3100 — unusable outside the monorepo dev machine.
    for (const content of [claudeDesktop, cursor, env]) {
      expect(content.includes("/path/to/packages")).toBe(false);
      expect(content.includes("127.0.0.1:3100")).toBe(false);
    }
    expect(claudeDesktop.includes("@anima-labs/mcp")).toBe(true);
    expect(cursor.includes("https://mcp.useanima.sh/mcp")).toBe(true);
  });

  it("includes the MCP-first preference statement (mirrors Stripe link-cli)", () => {
    const skill = readText(skillPath);
    expect(skill.toLowerCase()).toContain("mcp server");
    expect(skill.toLowerCase()).toContain("fall back to the cli");
  });
});

describe("template files", () => {
  it("exist and JSON templates are parseable", () => {
    expect(existsSync(templatesDir)).toBe(true);
    expect(statSync(templatesDir).isDirectory()).toBe(true);

    const claudeDesktopPath = join(templatesDir, "claude-desktop.json");
    const cursorPath = join(templatesDir, "cursor-mcp.json");
    const envPath = join(templatesDir, "env.example");

    expect(existsSync(claudeDesktopPath)).toBe(true);
    expect(existsSync(cursorPath)).toBe(true);
    expect(existsSync(envPath)).toBe(true);

    expect(() => JSON.parse(readText(claudeDesktopPath))).not.toThrow();
    expect(() => JSON.parse(readText(cursorPath))).not.toThrow();
  });

  it("templates are represented by package.json files allowlist", () => {
    const pkg = JSON.parse(readText(packageJsonPath)) as { files?: string[] };
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain("templates/");

    const entries = readdirSync(templatesDir);
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries).toContain("claude-desktop.json");
    expect(entries).toContain("cursor-mcp.json");
    expect(entries).toContain("env.example");
  });
});
