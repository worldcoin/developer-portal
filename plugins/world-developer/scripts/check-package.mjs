#!/usr/bin/env node
import { readFile, readdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { releaseFiles } from "./release-files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(
  await readFile(resolve(root, ".codex-plugin/plugin.json"), "utf8"),
);
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
if (
  manifest.name !== "world-developer" ||
  manifest.version !== pkg.version ||
  !/^\d+\.\d+\.\d+$/.test(manifest.version)
)
  throw new Error("Plugin and package versions must match a stable release.");
if (
  manifest.author?.name !== "World" ||
  manifest.license !== "MIT" ||
  manifest.skills !== "./skills/" ||
  manifest.mcpServers !== "./.mcp.json"
)
  throw new Error("Invalid release manifest.");
if (
  !Array.isArray(manifest.interface?.defaultPrompt) ||
  manifest.interface.defaultPrompt.some(
    (p) => typeof p !== "string" || p.length > 128,
  )
)
  throw new Error("Invalid starter prompts.");
const expected = ["world-build", "world-docs", "world-portal"];
const actual = (await readdir(resolve(root, "skills"), { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
if (JSON.stringify(actual) !== JSON.stringify(expected))
  throw new Error("Unexpected skill entrypoints: " + actual.join(", "));
async function checkLinks(path) {
  const text = await readFile(path, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    await access(resolve(dirname(path), target.split("#")[0]));
  }
}
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.name.endsWith(".md")) await checkLinks(child);
  }
}
await walk(resolve(root, "skills"));
for (const skill of expected) {
  const text = await readFile(
    resolve(root, "skills", skill, "SKILL.md"),
    "utf8",
  );
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error(`Missing frontmatter: ${skill}`);
  const frontmatter = parse(match[1]);
  if (frontmatter.name !== skill || !frontmatter.description)
    throw new Error(`Invalid frontmatter: ${skill}`);
  const ui = parse(
    await readFile(
      resolve(root, "skills", skill, "agents/openai.yaml"),
      "utf8",
    ),
  );
  if (!ui.interface?.default_prompt?.includes(`$${skill}`))
    throw new Error(`Invalid UI metadata: ${skill}`);
}
for (const path of await releaseFiles(root)) {
  if (/(?:^|\/)\.env|api-key|signing-.*\.env/.test(path))
    throw new Error(`Secret filename in release: ${path}`);
  if (!/\.(?:md|mjs|js|json|yaml|py|svg)$/.test(path)) continue;
  const text = await readFile(resolve(root, path), "utf8");
  if (
    text.includes("[TO" + "DO:") ||
    /(?:\/Users\/|\/home\/)[a-zA-Z0-9_.-]+\//.test(text) ||
    /api_[A-Za-z0-9+/_=-]{60,}/.test(text)
  )
    throw new Error(`Personal data or unfinished content in release: ${path}`);
}
await checkLinks(resolve(root, "README.md"));
const { Portal } = await import("./portal.mjs");
const tools = new Portal().list().tools;
if (
  tools.find((t) => t.name === "get_world_id_signing_key").inputSchema
    .properties.rotate_if_unavailable
)
  throw new Error("Read tool can rotate");
for (const name of ["configure_world_id", "rotate_world_id_signing_key"])
  if (
    tools.find((t) => t.name === name).inputSchema.properties.signer_private_key
  )
    throw new Error("Tool accepts private key in conversation");
console.log("Package references and protected Portal tool schemas passed.");
