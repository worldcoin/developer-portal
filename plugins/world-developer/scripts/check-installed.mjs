#!/usr/bin/env node
/** Verify plugin discovery and read tools through Codex's runtime, without an LLM turn. */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
let marketplace = "world",
  marketplacePath;
for (let i = 0; i < args.length; i += 2) {
  if (!args[i + 1])
    throw new Error("Expected --marketplace NAME or --marketplace-path PATH");
  if (args[i] === "--marketplace") marketplace = args[i + 1];
  else if (args[i] === "--marketplace-path")
    marketplacePath = resolve(args[i + 1]);
  else throw new Error(`Unknown option: ${args[i]}`);
}

const processHandle = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "pipe"],
});
const pending = new Map();
const startup = {};
let sequence = 0;
processHandle.stderr.resume();
const lines = createInterface({ input: processHandle.stdout });
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  if (
    message.method === "mcpServer/startupStatus/updated" &&
    ["world-docs", "world-portal"].includes(message.params.name)
  )
    startup[message.params.name] = message.params.status;
  const request = pending.get(message.id);
  if (request) {
    pending.delete(message.id);
    message.error
      ? request.reject(new Error(message.error.message))
      : request.resolve(message.result);
  } else if (message.id !== undefined && message.method)
    processHandle.stdin.write(
      JSON.stringify({
        id: message.id,
        error: {
          code: -32601,
          message:
            "Read-only installation check does not approve additional operations.",
        },
      }) + "\n",
    );
});
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    processHandle.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  });
}
const timeout = setTimeout(() => {
  for (const request of pending.values())
    request.reject(new Error("Installation check timed out."));
  processHandle.kill();
}, 55000);
processHandle.on("error", () => {
  for (const request of pending.values())
    request.reject(
      new Error(
        "Codex could not start. Install a Codex version with plugin support.",
      ),
    );
});
processHandle.on("exit", () => {
  for (const request of pending.values())
    request.reject(
      new Error("Codex exited before the installation check completed."),
    );
});
try {
  await rpc("initialize", {
    clientInfo: { name: "world-developer-install-check", version: "1.0.0" },
    capabilities: { experimentalApi: true },
  });
  processHandle.stdin.write(JSON.stringify({ method: "initialized" }) + "\n");
  const { plugin } = await rpc("plugin/read", {
    pluginName: "world-developer",
    ...(marketplacePath
      ? { marketplacePath }
      : { remoteMarketplaceName: marketplace }),
  });
  if (!plugin.summary.installed || !plugin.summary.enabled)
    throw new Error(
      "World Developer must be installed and enabled in the selected catalog.",
    );
  const workspace = await mkdtemp(join(tmpdir(), "world-installed-check-"));
  const { thread } = await rpc("thread/start", {
    cwd: workspace,
    ephemeral: true,
    approvalPolicy: "never",
    sandbox: "read-only",
  });
  const inventory = await rpc("mcpServerStatus/list", { threadId: thread.id });
  const servers = inventory.data.filter(
    (s) =>
      ["world-docs", "world-portal"].includes(s.name) &&
      s.pluginId === plugin.summary.id,
  );
  if (
    servers.length !== 2 ||
    servers.some((s) => !s.serverInfo || !Object.keys(s.tools).length)
  )
    throw new Error("Both bundled servers must initialize and expose tools.");
  const portal = await rpc("mcpServer/tool/call", {
    threadId: thread.id,
    server: "world-portal",
    tool: "portal_connection_status",
    arguments: {},
  });
  const docs = await rpc("mcpServer/tool/call", {
    threadId: thread.id,
    server: "world-docs",
    tool: "search_world_documentation",
    arguments: { query: "World ID IDKit integration guide" },
  });
  if (
    docs.isError ||
    !docs.content?.some(
      (block) => block.type === "text" && block.text.includes("docs.world.org"),
    )
  )
    throw new Error("World Docs did not return documentation results.");
  console.log(
    JSON.stringify(
      {
        installed: plugin.summary.installed,
        enabled: plugin.summary.enabled,
        skills: plugin.skills.map((s) => s.name),
        servers: servers.map((s) => ({
          name: s.name,
          tools: Object.keys(s.tools).length,
        })),
        portal,
        docs_response_received: !!docs && !docs.isError,
        startup,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  lines.close();
  processHandle.kill();
}
