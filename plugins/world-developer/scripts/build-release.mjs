#!/usr/bin/env node
import {
  cp,
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  access,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseFiles } from "./release-files.mjs";

export async function buildRelease({
  root = fileURLToPath(new URL("..", import.meta.url)),
  outputDir,
  marketplacePath = resolve(root, "../../.agents/plugins/marketplace.json"),
} = {}) {
  const manifest = JSON.parse(
    await readFile(join(root, ".codex-plugin/plugin.json"), "utf8"),
  );
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  if (
    manifest.name !== "world-developer" ||
    manifest.version !== pkg.version ||
    !/^\d+\.\d+\.\d+$/.test(manifest.version)
  )
    throw new Error(
      "Release requires matching stable plugin/package versions.",
    );
  const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
  const entry = marketplace.plugins.find((p) => p.name === manifest.name);
  if (
    !entry ||
    entry.source?.source !== "local" ||
    entry.source.path !== "./plugins/world-developer"
  )
    throw new Error(
      "Catalog must point to the distributable plugin directory.",
    );
  const output = outputDir
    ? resolve(outputDir)
    : await mkdtemp(join(tmpdir(), "world-plugin-release-"));
  await mkdir(output, { recursive: true });
  const archive = join(output, `world-developer-v${manifest.version}.tar.gz`);
  try {
    await access(archive);
    throw new Error(
      "Release archive already exists; choose a new output directory.",
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const stage = await mkdtemp(join(tmpdir(), "world-plugin-package-"));
  for (const path of await releaseFiles(root)) {
    const destination = join(stage, "plugins/world-developer", path);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(root, path), destination, {
      errorOnExist: true,
      force: false,
    });
  }
  await mkdir(join(stage, ".agents/plugins"), { recursive: true });
  await writeFile(
    join(stage, ".agents/plugins/marketplace.json"),
    JSON.stringify({ ...marketplace, plugins: [entry] }, null, 2) + "\n",
  );
  execFileSync("tar", ["-czf", archive, "-C", stage, ".agents", "plugins"], {
    stdio: "pipe",
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  return {
    archive,
    tag: `world-developer-v${manifest.version}`,
    version: manifest.version,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--output-dir"))
    throw new Error("Usage: build-release.mjs [--output-dir PATH]");
  console.log(JSON.stringify(await buildRelease({ outputDir: args[1] })));
}
