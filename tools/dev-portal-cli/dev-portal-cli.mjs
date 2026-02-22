#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".dev-portal");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const ensureConfigDir = () => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
};

const saveConfig = (config) => {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];
const flags = Object.fromEntries(
  args
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace("--", "").split("=");
      return [k, v ?? true];
    }),
);

const baseUrl = flags.baseUrl || process.env.DEV_PORTAL_API_URL || "http://localhost:4010";

const authHeaders = () => {
  const cfg = loadConfig();
  if (!cfg.accessToken) {
    throw new Error("Not authenticated. Run auth api-key or auth login first.");
  }
  return {
    Authorization: `Bearer ${cfg.accessToken}`,
    "Content-Type": "application/json",
  };
};

const callApi = async (pathname, options = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
};

const run = async () => {
  if (command === "auth" && subcommand === "api-key") {
    if (!flags.apiKey) {
      throw new Error("Missing --apiKey");
    }
    saveConfig({ ...loadConfig(), accessToken: flags.apiKey, baseUrl });
    console.log("Saved API key as access token in ~/.dev-portal/config.json");
    return;
  }

  if (command === "auth" && subcommand === "login") {
    const start = await callApi("/api/v1/auth/cli/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: "dev-portal-cli" }),
    });

    console.log(`Open this URL in your browser: ${start.verification_uri}`);
    console.log(`Enter this code when prompted: ${start.user_code}`);

    let token;
    for (let i = 0; i < 20; i += 1) {
      await new Promise((r) => setTimeout(r, start.interval_ms));
      const poll = await callApi("/api/v1/auth/cli/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: start.device_code }),
      });
      if (poll.status === "approved") {
        token = poll.access_token;
        break;
      }
    }

    if (!token) {
      throw new Error("Login timed out waiting for approval.");
    }

    saveConfig({ ...loadConfig(), accessToken: token, baseUrl });
    console.log("Login completed and access token saved.");
    return;
  }

  if (command === "teams" && subcommand === "create") {
    if (!flags.name) throw new Error("Missing --name");
    const team = await callApi("/api/v1/teams", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: flags.name }),
    });
    console.log(JSON.stringify(team, null, 2));
    return;
  }

  if (command === "apps" && subcommand === "create") {
    if (!flags.teamId || !flags.name) {
      throw new Error("Missing --teamId or --name");
    }
    const app = await callApi("/api/v1/apps", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ team_id: flags.teamId, name: flags.name }),
    });
    console.log(JSON.stringify(app, null, 2));
    return;
  }

  if (command === "miniapps" && subcommand === "submit") {
    const required = ["appId", "description", "category"];
    const missing = required.filter((x) => !flags[x]);
    if (missing.length) {
      throw new Error(`Missing flags: ${missing.join(", ")}`);
    }

    const submission = await callApi("/api/v1/miniapps/submissions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        app_id: flags.appId,
        description: flags.description,
        category: flags.category,
      }),
    });

    console.log(JSON.stringify(submission, null, 2));
    return;
  }

  console.log(`Unknown command: ${args.join(" ")}

Usage examples:
  dev-portal-cli.mjs auth api-key --apiKey=dp_xxx
  dev-portal-cli.mjs auth login
  dev-portal-cli.mjs teams create --name="My Team"
  dev-portal-cli.mjs apps create --teamId=team_123 --name="My App"
  dev-portal-cli.mjs miniapps submit --appId=app_123 --description="..." --category="productivity"
`);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
