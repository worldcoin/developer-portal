/** Generate the plugin snapshot and embedded MCP guide from canonical Portal sources. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { format } from "prettier";
import { readStaticMcpContract } from "./lib/static-mcp-contract";

async function main() {
  const root = resolve(__dirname, "..");
  const contract = readStaticMcpContract(
    resolve(root, "api/mcp/index.ts"),
    root,
  );
  if (!Array.isArray(contract))
    throw new Error("Expected an array of MCP tools");
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check"))
    throw new Error("Usage: tsx scripts/generate-mcp-contract.ts [--check]");
  const guide = readFileSync(resolve(root, "api/mcp/SKILL.md"), "utf8")
    .replace(/^---\n[\s\S]*?\n---\n+/, "")
    .trim();
  const escapedGuide = guide
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
  const outputs = new Map([
    [
      resolve(root, "../plugins/world-developer/contracts/portal-tools.json"),
      JSON.stringify(contract),
    ],
    [
      resolve(root, "api/mcp/skill.ts"),
      "// Generated from api/mcp/SKILL.md by scripts/generate-mcp-contract.ts.\n// Do not edit directly.\nexport const SKILL_INSTRUCTIONS = `" +
        escapedGuide +
        "`;\n",
    ],
  ]);
  for (const [path, content] of outputs) {
    const formatted = await format(content, {
      parser: path.endsWith(".json") ? "json" : "typescript",
    });
    if (args.includes("--check")) {
      if (readFileSync(path, "utf8") !== formatted)
        throw new Error(`Generated MCP resource is stale: ${path}`);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, formatted);
    }
  }
  console.log(
    args.includes("--check")
      ? "MCP generated resources are current."
      : "MCP resources generated.",
  );
}
void main();
