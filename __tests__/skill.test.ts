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

/**
 * skills.sh indexes a repository by crawling `skills/<name>/SKILL.md`. A single
 * SKILL.md at the repo root -- which is how this package shipped until now -- is
 * invisible to it, which is why Anima returned no results for its own category
 * while competitors held three of the top four slots.
 *
 * The root SKILL.md stays canonical because package.json ships it, so
 * skills/anima/SKILL.md is a mirror and these tests are what stop the two
 * drifting apart.
 */
const skillsDir = join(pkgDir, "skills");
const EXPECTED_SKILLS = [
  "anima",
  "anima-cli",
  "anima-go",
  "anima-mcp",
  "anima-onboarding",
  "anima-python",
  "anima-ts",
  "anima-vault",
];

describe("skills/ directory layout (skills.sh discoverability)", () => {
  it("exposes every skill at skills/<name>/SKILL.md", () => {
    expect(existsSync(skillsDir)).toBe(true);
    const found = readdirSync(skillsDir)
      .filter((d) => statSync(join(skillsDir, d)).isDirectory())
      .sort();
    expect(found).toEqual(EXPECTED_SKILLS);
    for (const name of found) {
      expect(existsSync(join(skillsDir, name, "SKILL.md"))).toBe(true);
    }
  });

  it("keeps skills/anima/SKILL.md identical to the canonical root SKILL.md", () => {
    // package.json ships the root file; the crawler reads the skills/ copy.
    // If these diverge, published guidance and indexed guidance disagree and
    // only one of them is ever tested.
    expect(readText(join(skillsDir, "anima", "SKILL.md"))).toBe(readText(skillPath));
  });

  it("gives every skill frontmatter whose name matches its directory", () => {
    // A mismatch here publishes under the wrong slug, which is the one error
    // that cannot be corrected by editing content later.
    for (const name of EXPECTED_SKILLS) {
      const body = readText(join(skillsDir, name, "SKILL.md"));
      expect(body.startsWith("---\n")).toBe(true);
      const frontmatter = body.slice(4, body.indexOf("\n---", 4));
      const declared = /^name:\s*(\S+)\s*$/m.exec(frontmatter)?.[1];
      expect(declared).toBe(name);
      expect(/^description:/m.test(frontmatter)).toBe(true);
    }
  });

  it("does not promise the numbers clear third-party verification gates", () => {
    // Anima's US numbers are geographic fixed-line via the carrier, so they
    // send and receive SMS but are not guaranteed to pass a signup gate that
    // checks line type. This claim was retracted across every public surface;
    // these files must not reintroduce it.
    for (const name of EXPECTED_SKILLS) {
      const body = readText(join(skillsDir, name, "SKILL.md")).toLowerCase();
      expect(body).not.toContain("receives sms verification codes");
      expect(body).not.toContain("passes carrier verification");
    }
  });
});
