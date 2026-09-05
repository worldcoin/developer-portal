import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { buildRelease } from "../scripts/build-release.mjs";

test("release archive is self-contained and the adapter starts without Portal dependencies", async () => {
  const { archive } = await buildRelease();
  const destination = await mkdtemp(join(tmpdir(), "world-plugin-extract-"));
  execFileSync("tar", ["-xzf", archive, "-C", destination]);
  const listing = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" });
  assert.ok(!listing.includes("node_modules/"));
  assert.ok(!listing.includes("LIVE-RESULTS.md"));
  assert.ok(!listing.includes("evaluations/results.json"));
  const catalog = JSON.parse(
    await readFile(
      join(destination, ".agents/plugins/marketplace.json"),
      "utf8",
    ),
  );
  assert.equal(catalog.name, "world");
  const root = join(destination, "plugins/world-developer");
  const config = JSON.parse(await readFile(join(root, ".mcp.json"), "utf8"));
  const server = config.mcpServers["world-portal"];
  assert.equal(server.cwd, "./");
  const response = await new Promise((resolve, reject) => {
    const proc = spawn(server.command, server.args, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Adapter startup timed out"));
    }, 5000);
    proc.stdout.on("data", (data) => (stdout += data));
    proc.stderr.on("data", (data) => (stderr += data));
    proc.on("error", reject);
    proc.on("exit", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(stdout) : reject(new Error(stderr));
    });
    proc.stdin.end(
      '{"jsonrpc":"2.0","id":1,"method":"initialize"}\n{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n',
    );
  });
  const messages = response.trim().split("\n").map(JSON.parse);
  assert.equal(messages[0].result.serverInfo.name, "world-portal");
  assert.ok(
    messages[1].result.tools.some((t) => t.name === "run_test_verification"),
  );
});
