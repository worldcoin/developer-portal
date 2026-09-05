#!/usr/bin/env node
import { constants as C } from "node:fs";
import { open, lstat, realpath, rename, unlink } from "node:fs/promises";
import {
  resolve,
  dirname,
  relative,
  isAbsolute,
  join,
  basename,
} from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { readPrivateFile, PortalError } from "./portal.mjs";

export async function installSecret({
  source,
  project,
  destination,
  variable,
}) {
  if (
    !/^[A-Z][A-Z0-9_]*$/.test(variable || "") ||
    /^(NEXT_PUBLIC_|PUBLIC_|VITE_)/.test(variable)
  )
    throw new PortalError(
      "invalid_variable",
      "Choose a server-only environment variable.",
    );
  if (![source, project, destination].every((p) => p && isAbsolute(p)))
    throw new PortalError(
      "invalid_path",
      "Use absolute source, project and destination paths.",
    );
  const root = await realpath(project);
  const parent = await realpath(dirname(destination));
  if (
    relative(root, parent).startsWith("..") ||
    isAbsolute(relative(root, parent))
  )
    throw new PortalError(
      "invalid_path",
      "Destination must be inside the project.",
    );
  const requestedParent = resolve(
    root,
    relative(resolve(project), resolve(dirname(destination))),
  );
  if (parent !== requestedParent)
    throw new PortalError(
      "invalid_path",
      "Destination must not traverse a project symlink.",
    );
  destination = join(parent, basename(destination));
  const path = relative(root, destination);
  try {
    execFileSync("git", ["check-ignore", "-q", "--", path], {
      cwd: root,
      stdio: "pipe",
    });
    if (
      execFileSync("git", ["ls-files", "--", path], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe",
      }).trim()
    )
      throw new Error();
  } catch {
    throw new PortalError(
      "tracked_destination",
      "Destination must be Git-ignored and untracked.",
    );
  }
  const secret = await readPrivateFile(source);
  const match = /^WORLD_ID_SIGNING_KEY=(0x[0-9a-fA-F]{64})\n?$/.exec(secret);
  if (!match)
    throw new PortalError(
      "invalid_secret",
      "Source is not a protected signing-key env file.",
    );
  let existing = "",
    original;
  try {
    original = await lstat(destination);
    existing = await readPrivateFile(destination);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (new RegExp(`^\\s*(?:export\\s+)?${variable}\\s*=`, "m").test(existing))
    throw new PortalError(
      "existing_variable",
      "Destination already defines that variable; it was preserved.",
    );
  const staged = join(parent, `.world-secret-${randomUUID()}`);
  const handle = await open(
    staged,
    C.O_WRONLY | C.O_CREAT | C.O_EXCL | C.O_NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(
      `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${variable}=${match[1]}\n`,
    );
    await handle.sync();
    await handle.close();
    if (original) {
      const current = await lstat(destination);
      if (
        current.ino !== original.ino ||
        current.mtimeMs !== original.mtimeMs ||
        current.size !== original.size
      )
        throw new PortalError(
          "concurrent_change",
          "Destination changed during transfer; retry after inspecting it.",
        );
      await rename(staged, destination);
    } else {
      const { link } = await import("node:fs/promises");
      await link(staged, destination);
      await unlink(staged);
    }
    return { destination, variable, installed: true };
  } finally {
    await handle.close().catch(() => {});
    await unlink(staged).catch(() => {});
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const options = Object.fromEntries(
    Array.from({ length: (process.argv.length - 2) / 2 }, (_, i) => [
      process.argv[2 + i * 2].replace(/^--/, ""),
      process.argv[3 + i * 2],
    ]),
  );
  try {
    process.stdout.write(JSON.stringify(await installSecret(options)) + "\n");
  } catch (e) {
    process.stderr.write(
      (e instanceof PortalError
        ? e.message
        : "Secret transfer failed; no value was printed.") + "\n",
    );
    process.exitCode = 1;
  }
}
