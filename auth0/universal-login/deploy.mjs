#!/usr/bin/env node
/**
 * Deploys page-template.html as the tenant's Universal Login page template.
 *
 * Usage:
 *   AUTH0_DOMAIN=<tenant>.auth0.com AUTH0_MGMT_TOKEN=<token> node deploy.mjs [--dry-run|--delete]
 *
 * Instead of AUTH0_MGMT_TOKEN you can pass AUTH0_MGMT_CLIENT_ID and
 * AUTH0_MGMT_CLIENT_SECRET for a machine-to-machine client authorized for the
 * Management API (scopes: read:branding, update:branding, read:custom_domains,
 * plus delete:branding if you want the --delete rollback).
 *
 * --dry-run  validates credentials, checks custom domains, and backs up the
 *            current template without writing anything to the tenant.
 * --delete   removes the custom page template, restoring Auth0's default.
 *
 * The current template (if any) is saved to backup-<timestamp>.html before
 * any write, so a bad deploy can be restored by re-running with the backup
 * copied over page-template.html.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const doDelete = process.argv.includes("--delete");

const domain = process.env.AUTH0_DOMAIN;
if (!domain) fail("AUTH0_DOMAIN is required (e.g. my-tenant.eu.auth0.com)");
const apiBase = `https://${domain}/api/v2`;

const token = process.env.AUTH0_MGMT_TOKEN || (await clientCredentialsToken());

await checkCustomDomains();
await backupCurrentTemplate();

if (dryRun) {
  console.log("Dry run: no changes written.");
  process.exit(0);
}

if (doDelete) {
  const res = await mgmt("DELETE", "/branding/templates/universal-login");
  if (!res.ok && res.status !== 404) {
    fail(`DELETE failed: ${res.status} ${await res.text()}`);
  }
  console.log("Custom page template removed; tenant is back on the default.");
  process.exit(0);
}

const template = await readFile(join(here, "page-template.html"), "utf8");
const res = await mgmt("PUT", "/branding/templates/universal-login", {
  headers: { "content-type": "text/html" },
  body: template,
});
if (!res.ok) fail(`PUT failed: ${res.status} ${await res.text()}`);
console.log("Page template deployed.");

async function clientCredentialsToken() {
  const id = process.env.AUTH0_MGMT_CLIENT_ID;
  const secret = process.env.AUTH0_MGMT_CLIENT_SECRET;
  if (!id || !secret) {
    fail(
      "Set AUTH0_MGMT_TOKEN, or AUTH0_MGMT_CLIENT_ID + AUTH0_MGMT_CLIENT_SECRET",
    );
  }
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
      audience: `${apiBase}/`,
    }),
  });
  if (!res.ok) fail(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

// Page templates only render on a verified custom domain — deploying without
// one succeeds but has no visible effect, so surface that loudly.
async function checkCustomDomains() {
  const res = await mgmt("GET", "/custom-domains");
  if (!res.ok) {
    console.warn(
      `Warning: could not check custom domains (${res.status}); ` +
        "the template only renders on a verified custom domain.",
    );
    return;
  }
  const domains = await res.json();
  const ready = domains.filter((d) => d.status === "ready");
  if (ready.length === 0) {
    console.warn(
      "Warning: no verified custom domain on this tenant. The template will " +
        "be stored but Universal Login will NOT render it until a custom " +
        "domain is configured and used.",
    );
  } else {
    console.log(
      `Custom domain(s) ready: ${ready.map((d) => d.domain).join(", ")}`,
    );
  }
}

async function backupCurrentTemplate() {
  const res = await mgmt("GET", "/branding/templates/universal-login");
  if (res.status === 404) {
    console.log("No existing custom template (tenant is on the default).");
    return;
  }
  if (!res.ok) fail(`GET current template failed: ${res.status}`);
  // The endpoint returns raw text/html, or JSON {body: "..."} depending on
  // the Accept negotiation — read the stream once and handle both.
  const raw = await res.text();
  let current = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.body === "string") current = parsed.body;
  } catch {
    /* raw HTML */
  }
  const file = join(
    here,
    `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.html`,
  );
  await writeFile(file, current);
  console.log(`Existing template backed up to ${file}`);
}

function mgmt(method, path, init = {}) {
  return fetch(`${apiBase}${path}`, {
    method,
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
