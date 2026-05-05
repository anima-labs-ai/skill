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

  it("mentions every channel + payment surface in the unified-identity wedge", () => {
    const skill = readText(skillPath);
    const surfaces = [
      "email",
      "phone",
      "voice",
      "vault",
      "card",
      "address",
      "webhook",
      "x402",
      "mpp",
      "spend-request",
      "passkey",
      "MCP",
    ];

    for (const surface of surfaces) {
      expect(skill.toLowerCase().includes(surface.toLowerCase())).toBe(true);
    }
  });

  it("includes the MCP-first preference statement (mirrors Stripe link-cli)", () => {
    const skill = readText(skillPath);
    expect(skill.toLowerCase()).toContain("mcp server");
    expect(skill.toLowerCase()).toContain("fall back to the cli");
  });

  it("documents the spend-request lifecycle agents follow", () => {
    const skill = readText(skillPath).toLowerCase();
    // Each lifecycle state must be referenced (case-insensitive — the doc
    // uses lowercase 'pending_approval' inline, the API contract uses
    // 'PENDING_APPROVAL' enum values; both are valid).
    for (const state of ["created", "pending_approval", "approved", "denied", "expired"]) {
      expect(skill.includes(state)).toBe(true);
    }
  });

  it("calls out the step-up threshold and 5-minute approval TTL", () => {
    const skill = readText(skillPath);
    // The cardholder approval flow has two key constants — both must be
    // documented so agents and humans align on expectations.
    expect(skill).toMatch(/\$200|step.up/i);
    expect(skill).toMatch(/5.minute|five.minute|5.min|5min/i);
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
