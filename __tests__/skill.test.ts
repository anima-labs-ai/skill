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
    expect(pkg.author).toBe("Anima Labs <support@anima.email>");
    expect(pkg.homepage).toBe("https://github.com/anima-labs-ai/skill");
    expect(pkg.repository?.url).toBe("https://github.com/anima-labs-ai/skill");
  });
});

describe("SKILL.md content coverage", () => {
  it("exists and includes required major sections", () => {
    expect(existsSync(skillPath)).toBe(true);
    const skill = readText(skillPath);

    const requiredSections = [
      "## Quick Start",
      "## Architecture Overview",
      "## MCP Server Setup",
      "## Complete Tool Reference",
      "## CLI Reference",
      "## Workflow Recipes",
      "## Troubleshooting",
      "## Best Practices",
    ];

    for (const section of requiredSections) {
      expect(skill.includes(section)).toBe(true);
    }
  });

  it("mentions all 13 MCP tool domains", () => {
    const skill = readText(skillPath);
    const domains = [
      "Organization",
      "Agent",
      "Email",
      "Domain",
      "Phone",
      "Message",
      "Cards",
      "Vault",
      "Webhook",
      "Security",
      "Utility",
      "Browser Payments",
      "x402",
    ];

    for (const domain of domains) {
      expect(skill.toLowerCase().includes(domain.toLowerCase())).toBe(true);
    }
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
