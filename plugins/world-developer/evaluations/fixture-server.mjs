#!/usr/bin/env node
/** Offline evaluation boundary. Never contacts World or accepts real credentials. */
import { readFile, appendFile } from "node:fs/promises";
import { createInterface } from "node:readline";
const [kind, scenario, log] = process.argv.slice(2);
const contract = JSON.parse(
  await readFile(new URL("../contracts/portal-tools.json", import.meta.url)),
);
const APP = "app_0123456789abcdef0123456789abcdef";
const RP = "rp_0123456789abcdef";
let polls = 0;
const docs = {
  "/world-id/idkit/integrate.mdx":
    "# IDKit integration (evaluation snapshot)\nFor IDKit 4.2, sign RP context only on the backend. Forward the complete IDKit result to POST /api/v4/verify/{rp_id}. The code action, Portal action and environment must agree. Validate expected context before granting the protected operation. For one-time claims, atomically enforce action-scoped nullifier uniqueness with the grant. For repeatable sign-in, consume a fresh per-session challenge, not a permanent one-use-per-human ban. An existing v3 application can be diagnosed without migration. Follow its installed SDK reference. These fixture APIs are provided as a deterministic evaluation snapshot.\n",
  "/mini-apps/quick-start/app-store.mdx":
    "# Review preparation (evaluation snapshot)\nA Mini App draft needs a reachable HTTPS integration URL, support link, overview, logo, content card, showcase, and supported locales. Preparation does not authorize submission. Desktop checks do not establish World App device behavior. Missing images must be supplied or separately generated before upload.\n",
  "/world-chain/quick-start/info.mdx":
    "# Network information (evaluation snapshot)\nWorld Chain mainnet is chain ID 480; Sepolia is 4801. Read network data from the target RPC before broadcasting. Inspecting configuration does not authorize deployment.\n",
  "/agents/human-in-the-loop/integrate.mdx":
    "# Human approval (evaluation snapshot)\nPersist the pending action and bind exact tool arguments to approval. Verify the proof on a trusted backend and consume approval once before executing. Registration as a human-backed agent is not permission to execute every tool. Handle denial, expiry and replay.\n",
};
const docsTools = [
  {
    name: "search_world_documentation",
    description:
      "Search the deterministic World documentation snapshot for this evaluation.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "query_docs_filesystem_world_documentation",
    description:
      "Read exact pages from the evaluation docs snapshot with head/cat, or list pages with tree.",
    inputSchema: {
      type: "object",
      properties: { command: { type: "string" } },
      required: ["command"],
    },
  },
];
const text = (value) => ({
  content: [
    {
      type: "text",
      text: typeof value === "string" ? value : JSON.stringify(value),
    },
  ],
});
async function handle(req) {
  if (req.method === "initialize")
    return {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: `fixture-${kind}`, version: "1.0.0" },
    };
  if (req.method === "ping") return {};
  if (req.method === "tools/list")
    return { tools: kind === "docs" ? docsTools : contract };
  if (req.method !== "tools/call") return {};
  const { name, arguments: args = {} } = req.params;
  await appendFile(log, JSON.stringify({ kind, name, arguments: args }) + "\n");
  if (kind === "docs") {
    if (name === "search_world_documentation")
      return text(
        Object.entries(docs).map(([path, content]) => ({
          path,
          url: `https://docs.world.org${path.replace(".mdx", "")}`,
          content,
        })),
      );
    const paths = Object.keys(docs).filter((path) =>
      args.command.includes(path),
    );
    return text(
      paths.length
        ? paths.map((path) => docs[path]).join("\n")
        : Object.keys(docs).join("\n"),
    );
  }
  if (name === "get_team_context")
    return text({
      team: { id: "team_fixture" },
      apps: [{ id: APP, name: "Fixture Claims", rp_id: RP }],
    });
  if (name === "get_app_config")
    return text({
      app_id: APP,
      rp_id: RP,
      is_staging: false,
      app_mode: scenario === "review" ? "mini-app" : "external",
      world_id: {
        status: scenario === "resume" && polls < 2 ? "pending" : "registered",
        signer_address: "0x" + "ab".repeat(20),
        actions: [
          {
            action: scenario === "diagnose" ? "verify-account" : "claim",
            environment: "staging",
          },
        ],
      },
      metadata: {
        verification_status: "unverified",
        description_overview: "An example mini app.",
        integration_url: "https://example.test",
        supported_languages: ["en"],
        supported_countries: ["us"],
        support_link: null,
        logo_img_url: null,
        content_card_image_url: null,
        showcase_img_urls: [],
      },
    });
  if (name === "get_world_id_registration_status") {
    polls++;
    const status =
      scenario === "resume" && polls < 2 ? "pending" : "registered";
    return text({
      app_id: APP,
      rp_id: RP,
      status,
      staging_status: status,
    });
  }
  if (name === "get_world_id_signing_key")
    return text({ signer_address: "0x" + "ab".repeat(20), private_key: null });
  return {
    ...text({
      error:
        "This fixture already has an app and RP. No mutation is needed for the requested task.",
    }),
    isError: true,
  };
}
for await (const line of createInterface({ input: process.stdin })) {
  let req;
  try {
    req = JSON.parse(line);
    if (req.id === undefined) continue;
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: req.id,
        result: await handle(req),
      }) + "\n",
    );
  } catch {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: req?.id ?? null,
        error: { code: -32603, message: "Fixture request failed." },
      }) + "\n",
    );
  }
}
