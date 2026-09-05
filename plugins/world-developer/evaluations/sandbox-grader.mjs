// Only this container, never a host Node process, imports model-written code.
import { randomUUID } from "node:crypto";
import { realpath, lstat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const GRADER_IMAGE = "node:20-alpine";
export async function gradeClaims(project, run) {
  const fixture = await realpath(project);
  const grader = await realpath(
    fileURLToPath(new URL("grade-claims.mjs", import.meta.url)),
  );
  if (!(await lstat(fixture)).isDirectory() || /[,\n\r]/.test(fixture + grader))
    throw new Error("Invalid grader mount path");
  const name = "world-eval-grader-" + randomUUID();
  // Only the trusted Docker client receives host connection settings.
  // No host environment is forwarded into the container.
  const env = Object.fromEntries(
    [
      "PATH",
      "HOME",
      "DOCKER_HOST",
      "DOCKER_CONTEXT",
      "DOCKER_CONFIG",
      "DOCKER_TLS_VERIFY",
      "DOCKER_CERT_PATH",
    ]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  );
  try {
    return await run(
      "docker",
      [
        "run",
        "--rm",
        "--name",
        name,
        "--pull=never",
        "--network=none",
        "--read-only",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--pids-limit=64",
        "--memory=256m",
        "--cpus=1",
        "--user=65534:65534",
        "--mount",
        "type=bind,src=" + fixture + ",dst=/fixture,readonly",
        "--mount",
        "type=bind,src=" + grader + ",dst=/grader.mjs,readonly",
        "--env",
        "WORLD_EVAL_PROJECT=/fixture",
        "--workdir=/fixture",
        GRADER_IMAGE,
        "node",
        "--test",
        "/grader.mjs",
      ],
      { env },
    );
  } finally {
    // A timed-out Docker client does not necessarily stop its container.
    await run("docker", ["rm", "-f", name], { env });
  }
}
