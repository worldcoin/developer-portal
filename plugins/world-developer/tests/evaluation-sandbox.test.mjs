import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir, homedir } from "node:os";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { gradeClaims } from "../evaluations/sandbox-grader.mjs";
test("grader fails closed with no host-execution fallback and always cleans up", async () => {
  const project = await mkdtemp(join(tmpdir(), "world-grader-options-"));
  const calls = [];
  const result = await gradeClaims(project, async (command, args, options) => {
    calls.push({ command, args, options });
    return { code: 125, stderr: "Docker unavailable" };
  });
  assert.equal(result.code, 125);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].command, "docker");
  for (const flag of [
    "--network=none",
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--user=65534:65534",
    "--pull=never",
  ])
    assert.ok(calls[0].args.includes(flag));
  assert.deepEqual(
    calls[0].args.filter((_, index, args) => args[index - 1] === "--env"),
    ["WORLD_EVAL_PROJECT=/fixture"],
  );
  assert.equal(calls[0].options.env.WORLD_DEVELOPER_API_KEY, undefined);
  assert.equal(calls[0].options.env.NODE_OPTIONS, undefined);
  assert.equal(calls[1].args[0], "rm");
  assert.equal(
    calls[1].args[2],
    calls[0].args[calls[0].args.indexOf("--name") + 1],
  );
});
test(
  "actual container denies host files, environment, writes and network",
  { skip: process.env.WORLD_EVAL_DOCKER_TEST !== "1" },
  async () => {
    const folder = await mkdtemp(join(homedir(), ".world-grader-containment-"));
    const project = join(folder, "project");
    await mkdir(project, { mode: 0o755 });
    const canary = join(folder, "host-only.txt");
    await writeFile(canary, "host sentinel");
    await writeFile(
      join(project, "claim.mjs"),
      `
    import assert from "node:assert/strict";
    import { readFile, writeFile } from "node:fs/promises";
    import { connect } from "node:net";
    assert.equal(process.getuid(), 65534);
    assert.equal(process.env.WORLD_EVAL_HOST_SENTINEL, undefined);
    await assert.rejects(readFile(${JSON.stringify(canary)}));
    await assert.rejects(readFile("/var/run/docker.sock"));
    await assert.rejects(writeFile("/fixture/escaped.txt", "bad"));
    await assert.rejects(new Promise((resolve, reject) => {
      const socket = connect({ host: "1.1.1.1", port: 80 });
      socket.once("connect", () => { socket.destroy(); resolve(); });
      socket.once("error", reject);
      socket.setTimeout(500, () => { socket.destroy(); reject(new Error("blocked")); });
    }));
    export function createClaimHandler(verify) {
      const redeemed = new Set();
      return {
        async claim(result) {
          const proof = await verify(result);
          if (!proof.valid) return { status: 400 };
          if (redeemed.has(proof.nullifier)) return { status: 409 };
          redeemed.add(proof.nullifier);
          return { status: 200 };
        },
        count() { return redeemed.size; }
      };
    }`,
    );
    const run = async (command, args, options) => {
      try {
        const result = await promisify(execFile)(command, args, {
          ...options,
          env: { ...options.env, WORLD_EVAL_HOST_SENTINEL: "not-forwarded" },
          timeout: 20000,
        });
        return { code: 0, ...result };
      } catch (error) {
        return {
          code: error.code,
          stdout: error.stdout ?? "",
          stderr: error.stderr ?? String(error),
        };
      }
    };
    const result = await gradeClaims(project, run);
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /# pass 3/);
    assert.equal(await readFile(canary, "utf8"), "host sentinel");
    await assert.rejects(readFile(join(project, "escaped.txt")));
  },
);
