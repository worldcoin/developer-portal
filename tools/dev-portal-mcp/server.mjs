#!/usr/bin/env node

import readline from "node:readline";

const apiBaseUrl = process.env.DEV_PORTAL_API_URL || "http://localhost:4010";
const apiToken = process.env.DEV_PORTAL_TOKEN || "mock_token";

const send = (message) => {
  process.stdout.write(`${JSON.stringify(message)}\n`);
};

const callApi = async (path, payload) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(body));
  }
  return body;
};

const tools = [
  {
    name: "create_team",
    description: "Create a developer portal team",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
      },
    },
  },
  {
    name: "create_app",
    description: "Create an app in a team",
    inputSchema: {
      type: "object",
      required: ["team_id", "name"],
      properties: {
        team_id: { type: "string" },
        name: { type: "string" },
      },
    },
  },
  {
    name: "submit_miniapp_form",
    description: "Submit mini app store listing metadata",
    inputSchema: {
      type: "object",
      required: ["app_id", "description", "category"],
      properties: {
        app_id: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
      },
    },
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ error: "invalid_json" });
    return;
  }

  try {
    if (msg.method === "tools/list") {
      send({ id: msg.id, result: { tools } });
      return;
    }

    if (msg.method === "tools/call") {
      const { name, arguments: args } = msg.params;
      if (name === "create_team") {
        const team = await callApi("/api/v1/teams", { name: args.name });
        send({ id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(team) }] } });
        return;
      }
      if (name === "create_app") {
        const app = await callApi("/api/v1/apps", {
          team_id: args.team_id,
          name: args.name,
        });
        send({ id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(app) }] } });
        return;
      }
      if (name === "submit_miniapp_form") {
        const submission = await callApi("/api/v1/miniapps/submissions", {
          app_id: args.app_id,
          description: args.description,
          category: args.category,
        });
        send({ id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(submission) }] } });
        return;
      }
      send({ id: msg.id, error: { code: -32601, message: `unknown_tool:${name}` } });
      return;
    }

    send({ id: msg.id, error: { code: -32601, message: "method_not_found" } });
  } catch (error) {
    send({
      id: msg.id,
      error: { code: -32000, message: error.message },
    });
  }
});
