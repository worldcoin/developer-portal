#!/usr/bin/env node

import http from "node:http";
import crypto from "node:crypto";

const db = {
  sessions: new Map(),
  teams: [],
  apps: [],
  submissions: [],
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(data ? JSON.parse(data) : {});
    });
    req.on("error", reject);
  });

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const tokenFromRequest = (req) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.replace("Bearer ", "");
};

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/v1/auth/cli/start") {
    const id = crypto.randomUUID();
    const deviceCode = `dev_${id}`;
    const userCode = id.slice(0, 6).toUpperCase();

    db.sessions.set(deviceCode, {
      status: "pending",
      accessToken: `mock_access_${id}`,
    });

    return send(res, 200, {
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `http://localhost:4010/mock/approve?device_code=${deviceCode}`,
      interval_ms: 1000,
    });
  }

  if (req.method === "GET" && req.url?.startsWith("/mock/approve")) {
    const parsed = new URL(`http://localhost:4010${req.url}`);
    const deviceCode = parsed.searchParams.get("device_code");
    const session = db.sessions.get(deviceCode);
    if (!session) return send(res, 404, { error: "unknown_device_code" });
    session.status = "approved";
    return send(res, 200, { ok: true, message: "Session approved. Return to CLI." });
  }

  if (req.method === "POST" && req.url === "/api/v1/auth/cli/token") {
    const body = await readBody(req);
    const session = db.sessions.get(body.device_code);
    if (!session) return send(res, 404, { error: "unknown_device_code" });
    if (session.status !== "approved") return send(res, 200, { status: "pending" });
    return send(res, 200, { status: "approved", access_token: session.accessToken });
  }

  if (req.method === "POST" && req.url === "/api/v1/teams") {
    if (!tokenFromRequest(req)) return send(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const team = { id: `team_${db.teams.length + 1}`, name: body.name };
    db.teams.push(team);
    return send(res, 201, team);
  }

  if (req.method === "POST" && req.url === "/api/v1/apps") {
    if (!tokenFromRequest(req)) return send(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const app = { id: `app_${db.apps.length + 1}`, team_id: body.team_id, name: body.name };
    db.apps.push(app);
    return send(res, 201, app);
  }

  if (req.method === "POST" && req.url === "/api/v1/miniapps/submissions") {
    if (!tokenFromRequest(req)) return send(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const submission = {
      id: `miniapp_submission_${db.submissions.length + 1}`,
      app_id: body.app_id,
      description: body.description,
      category: body.category,
      status: "submitted",
    };
    db.submissions.push(submission);
    return send(res, 201, submission);
  }

  return send(res, 404, { error: "not_found" });
});

server.listen(4010, () => {
  console.log("Mock dev portal API listening on http://localhost:4010");
});
