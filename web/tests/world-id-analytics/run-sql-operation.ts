import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required by the fresh-stack harness`);
  return value;
};

/**
 * Runs one of the `hasura/operations/world-id-analytics` scripts the way an
 * operator does: the file's own bytes, piped into psql inside the stack's
 * Postgres container.
 */
export const runSqlOperation = (filename: string) => {
  const repositoryRoot = requiredEnv("WIA_REPOSITORY_ROOT");
  const sql = readFileSync(
    path.join(repositoryRoot, "hasura/operations/world-id-analytics", filename),
    "utf8",
  );

  return spawnSync(
    "docker",
    [
      "compose",
      "--project-name",
      requiredEnv("WIA_COMPOSE_PROJECT"),
      "--file",
      requiredEnv("WIA_COMPOSE_FILE"),
      "exec",
      "--no-TTY",
      "postgres",
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set=ON_ERROR_STOP=1",
      "--file",
      "-",
    ],
    {
      encoding: "utf8",
      input: sql,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    },
  );
};

export const commandOutput = (result: ReturnType<typeof runSqlOperation>) =>
  `${result.stdout}\n${result.stderr}`;
