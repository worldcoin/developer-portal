#!/usr/bin/env node
/** Opt-in local model evaluation: isolated fixtures and fake MCP I/O, no World writes. */
import {
  cp,
  readFile,
  writeFile,
  mkdtemp,
  mkdir,
  readdir,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { answerSchema, gradeScenario, GRADING_VERSION } from "./grading.mjs";
import { gradeClaims } from "./sandbox-grader.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const only = args.includes("--case") ? args[args.indexOf("--case") + 1] : null;
const mode = args.includes("--mode")
  ? args[args.indexOf("--mode") + 1]
  : "both";
if (!["both", "plugin", "baseline"].includes(mode))
  throw new Error("mode must be both, plugin, or baseline");
const cases = JSON.parse(
  await readFile(join(root, "evaluations/cases.json")),
).filter((c) => !only || c.id === only);
if (!cases.length) throw new Error("Unknown evaluation case");
// Home directories are shared by Docker Desktop and Colima by default.
const output = await mkdtemp(join(homedir(), ".world-plugin-evaluation-"));
console.log(JSON.stringify({ output, mode, cases: cases.map((c) => c.id) }));
const cleanEnv = { ...process.env };
delete cleanEnv.WORLD_DEVELOPER_API_KEY;

async function run(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "",
      timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, 240000);
    child.stdout.on("data", (x) => {
      stdout += x;
    });
    child.stderr.on("data", (x) => {
      stderr += x;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}
async function hashProject(path) {
  const hash = createHash("sha256");
  async function walk(folder) {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if ([".git", ".agents", "node_modules"].includes(entry.name)) continue;
      const file = join(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else {
        hash.update(file.slice(path.length));
        hash.update(await readFile(file));
      }
    }
  }
  await walk(path);
  return hash.digest("hex");
}

const rows = [];
for (const scenario of cases)
  for (const variant of mode === "both" ? ["baseline", "plugin"] : [mode]) {
    const folder = join(output, `${scenario.id}-${variant}`);
    const project = join(folder, "project");
    await mkdir(folder, { recursive: true });
    await cp(join(root, "evaluations/fixtures/claims"), project, {
      recursive: true,
    });
    await run("git", ["init", "-q", project], {});
    if (variant === "plugin")
      await cp(join(root, "skills"), join(project, ".agents/skills"), {
        recursive: true,
      });
    const log = join(folder, "mcp.jsonl");
    await writeFile(log, "");
    const schema = join(folder, "result-schema.json");
    await writeFile(schema, JSON.stringify(answerSchema(scenario.id)));
    const configs = ["docs", "portal"].flatMap((kind) => [
      "-c",
      `mcp_servers.world-${kind}={ command = "node", args = ${JSON.stringify([join(root, "evaluations/fixture-server.mjs"), kind, scenario.id, log])}, default_tools_approval_mode = "approve" }`,
    ]);
    const before = await hashProject(project);
    const beforePackage = await readFile(join(project, "package.json"), "utf8");
    const beforeConfig = JSON.parse(
      await readFile(join(project, "world-config.json"), "utf8"),
    );
    const instruction = `${scenario.prompt}\nYou are operating on an isolated test project with deterministic World Docs and Portal MCP fixtures. Use those MCP tools for external information. Only edit files inside this project when the request requires changes. Do not access real accounts, network endpoints, global configuration, other projects, or delegate to agents. Do not inspect evaluation scripts or files outside this project.\n${variant === "plugin" ? `Use $${scenario.skill}; its SKILL.md is in .agents/skills/${scenario.skill}/SKILL.md. Load its relevant references.` : "No World workflow plugin is installed for this baseline; use the two MCP tools and project files."}`;
    const result = await run(
      "codex",
      [
        "exec",
        "--ignore-user-config",
        "--ephemeral",
        "--skip-git-repo-check",
        "-s",
        "workspace-write",
        "-C",
        project,
        "--json",
        "--output-schema",
        schema,
        "-o",
        join(folder, "answer.json"),
        ...configs,
        instruction,
      ],
      { env: cleanEnv },
    );
    await writeFile(join(folder, "events.jsonl"), result.stdout);
    await writeFile(join(folder, "stderr.txt"), result.stderr);
    const calls = (await readFile(log, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse);
    const writes = calls.filter(
      (c) =>
        c.kind === "portal" &&
        ![
          "get_team_context",
          "get_app_config",
          "get_world_id_signing_key",
          "get_world_id_registration_status",
        ].includes(c.name),
    );
    let grade = null;
    if (scenario.grade_claims) grade = await gradeClaims(project, run);
    if (grade)
      await writeFile(
        join(folder, "independent-tests.txt"),
        grade.stdout + grade.stderr,
      );
    const unchanged = before === (await hashProject(project));
    const packagePreserved =
      beforePackage === (await readFile(join(project, "package.json"), "utf8"));
    const afterConfig = JSON.parse(
      await readFile(join(project, "world-config.json"), "utf8"),
    );
    const targetPreserved = [
      "app_id",
      "rp_id",
      "action",
      "action_environment",
      "sdk_environment",
    ].every((key) => beforeConfig[key] === afterConfig[key]);
    let answer;
    try {
      answer = JSON.parse(await readFile(join(folder, "answer.json"), "utf8"));
    } catch {
      answer = null;
    }
    const row = {
      grading_version: GRADING_VERSION,
      case: scenario.id,
      variant,
      process_ok: result.code === 0,
      timed_out: !!result.timedOut,
      docs_calls: calls.filter((c) => c.kind === "docs").length,
      portal_calls: calls.filter((c) => c.kind === "portal").length,
      unexpected_writes: writes.length,
      unchanged,
      package_preserved: packagePreserved,
      target_preserved: targetPreserved,
      independent_tests: grade ? grade.code === 0 : null,
      answer,
      output: folder,
    };
    Object.assign(row, gradeScenario(scenario, row, calls));
    rows.push(row);
    await writeFile(
      join(output, "results.json"),
      JSON.stringify(rows, null, 2),
    );
    console.log(JSON.stringify(row));
  }
const releaseRows =
  mode === "baseline" ? rows : rows.filter((r) => r.variant === "plugin");
process.exitCode = releaseRows.every((r) => r.passed) ? 0 : 1;
