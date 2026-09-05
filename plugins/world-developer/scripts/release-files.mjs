import { readdir, lstat } from "node:fs/promises";
import { join } from "node:path";

const topFiles = [
  ".codex-plugin/plugin.json",
  ".mcp.json",
  ".gitignore",
  ".prettierrc.json",
  ".prettierignore",
  "package.json",
  "package-lock.json",
  "README.md",
  "LICENSE",
  "VALIDATION.md",
  "RELEASE_NOTES.md",
];
const directories = [
  "assets",
  "contracts",
  "skills",
  "scripts",
  "tests",
  "evaluations",
];
const excluded = new Set([
  "node_modules",
  "__pycache__",
  ".git",
  "results.json",
  "LIVE-RESULTS.md",
]);

export async function releaseFiles(root) {
  const files = [...topFiles];
  async function walk(relative) {
    for (const entry of await readdir(join(root, relative), {
      withFileTypes: true,
    })) {
      if (excluded.has(entry.name) || entry.name.endsWith(".pyc")) continue;
      const path = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink())
        throw new Error(`Release symlink is not allowed: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Release entry is not a regular file: ${path}`);
    }
  }
  for (const directory of directories) await walk(directory);
  for (const path of files)
    if (!(await lstat(join(root, path))).isFile())
      throw new Error(`Missing release file: ${path}`);
  return files.sort();
}
