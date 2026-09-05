import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  readFile,
  chmod,
  symlink,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { installSecret } from "../scripts/install-secret.mjs";

async function setup() {
  const project = await mkdtemp(join(tmpdir(), "world-secret-transfer-"));
  execFileSync("git", ["init", "-q", project]);
  await writeFile(join(project, ".gitignore"), ".env.local\n");
  const source = join(project, "source-secret");
  await writeFile(source, `WORLD_ID_SIGNING_KEY=0x${"ab".repeat(32)}\n`, {
    mode: 0o600,
  });
  return {
    project,
    source,
    destination: join(project, ".env.local"),
    variable: "WORLD_ID_SIGNING_KEY",
  };
}

test("transfers to ignored server-only env file and preserves existing values", async () => {
  const options = await setup();
  await writeFile(options.destination, "OTHER=value\n", { mode: 0o600 });
  const result = await installSecret(options);
  assert.equal(result.installed, true);
  assert.equal(JSON.stringify(result).includes("abababab"), false);
  assert.match(
    await readFile(options.destination, "utf8"),
    /^OTHER=value\nWORLD_ID_SIGNING_KEY=0x/,
  );
  assert.equal((await stat(options.destination)).mode & 0o777, 0o600);
});

test("creates a new ignored destination exclusively", async () => {
  const options = await setup();
  assert.equal((await installSecret(options)).installed, true);
  await assert.rejects(() => installSecret(options), {
    code: "existing_variable",
  });
});

test("refuses public variables and non-ignored or tracked destinations", async () => {
  const options = await setup();
  await assert.rejects(
    () => installSecret({ ...options, variable: "NEXT_PUBLIC_KEY" }),
    { code: "invalid_variable" },
  );
  await assert.rejects(
    () =>
      installSecret({
        ...options,
        destination: join(options.project, "config.env"),
      }),
    { code: "tracked_destination" },
  );
  await writeFile(options.destination, "", { mode: 0o600 });
  execFileSync("git", ["add", "-f", ".env.local"], { cwd: options.project });
  await assert.rejects(() => installSecret(options), {
    code: "tracked_destination",
  });
});

test("refuses symlinks and insecure destination permissions", async () => {
  const options = await setup();
  await symlink(options.source, options.destination);
  await assert.rejects(() => installSecret(options));
  const other = await setup();
  await writeFile(other.destination, "OTHER=value\n", { mode: 0o644 });
  await assert.rejects(() => installSecret(other), { code: "unsafe_storage" });
});

test("refuses pending reservations and existing exported variables", async () => {
  const options = await setup();
  await writeFile(options.destination, "export WORLD_ID_SIGNING_KEY=old\n", {
    mode: 0o600,
  });
  await assert.rejects(() => installSecret(options), {
    code: "existing_variable",
  });
  await writeFile(options.source, "# Pending registration\n");
  await assert.rejects(() => installSecret(options), {
    code: "invalid_secret",
  });
});
