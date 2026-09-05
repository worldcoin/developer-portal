#!/usr/bin/env node
/** Local, dependency-free stdio adapter for the official World Portal MCP. */
import { constants as C } from "node:fs";
import { open, readFile, mkdir, lstat, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

export const ENDPOINT = "https://developer.world.org/api/mcp";
export const DATA_DIR = join(homedir(), ".config", "world-developer");
const CONTRACT = JSON.parse(
  await readFile(
    new URL("../contracts/portal-tools.json", import.meta.url),
    "utf8",
  ),
);
const READS = new Set([
  "get_team_context",
  "get_app_config",
  "get_world_id_signing_key",
]);
const KEY_TOOLS = new Set([
  "configure_world_id",
  "rotate_world_id_signing_key",
]);
const OPTIONAL_TOOLS = new Set(["run_test_verification"]);
const LIMIT = 4 * 1024 * 1024;

export class PortalError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export async function privateDirectory(path) {
  if (process.platform === "win32")
    throw new PortalError(
      "unsupported_storage",
      "POSIX secret storage is required.",
    );
  await mkdir(path, { recursive: true, mode: 0o700 });
  const stat = await lstat(path);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    stat.uid !== process.getuid() ||
    stat.mode & 0o077
  ) {
    throw new PortalError(
      "unsafe_storage",
      "Secret directory must be owned by this user with mode 0700.",
    );
  }
  // Use the canonical directory for subsequent file creation (including macOS /private paths).
  const canonical = await realpath(path);
  return canonical;
}

export async function readPrivateFile(path) {
  let handle;
  try {
    handle = await open(path, C.O_RDONLY | C.O_NOFOLLOW);
    const stat = await handle.stat();
    if (
      !stat.isFile() ||
      stat.nlink !== 1 ||
      stat.uid !== process.getuid() ||
      stat.mode & 0o077 ||
      stat.size > LIMIT
    ) {
      throw new PortalError(
        "unsafe_storage",
        "Secret file must be a private regular file owned by this user.",
      );
    }
    return await handle.readFile("utf8");
  } finally {
    await handle?.close();
  }
}

export async function credential(env = process.env, dataDir = DATA_DIR) {
  let key = env.WORLD_DEVELOPER_API_KEY?.trim();
  if (!key) {
    try {
      key = (await readPrivateFile(join(dataDir, "api-key"))).trim();
    } catch (e) {
      if (e.code === "ENOENT")
        throw new PortalError(
          "missing_credentials",
          "Connect a Portal team with scripts/connect.py, or supply WORLD_DEVELOPER_API_KEY through the host secret environment.",
        );
      throw new PortalError(
        "unsafe_credentials",
        "Saved credential cannot be read securely. Check file ownership and permissions.",
      );
    }
  }
  if (!/^api_[A-Za-z0-9+/_=-]+$/.test(key))
    throw new PortalError(
      "invalid_credentials",
      "The configured team credential has an invalid format.",
    );
  return key;
}

// Parse embedded JSON before redacting so current Portal content blocks are covered.
export function redact(value, secrets = [], field = "", publicHex = new Set()) {
  if (Array.isArray(value))
    return value.map((v) => redact(v, secrets, field, publicHex));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        /private[_-]?key|signer_private_key|authorization|access[_-]?token/i.test(
          key,
        )
          ? v == null
            ? v
            : "[REDACTED]"
          : redact(v, secrets, key, publicHex),
      ]),
    );
  if (typeof value !== "string") return value;
  try {
    const embedded = JSON.parse(value);
    if (embedded && typeof embedded === "object")
      return JSON.stringify(redact(embedded, secrets, "", publicHex));
  } catch {
    /* ordinary text */
  }
  for (const secret of secrets.filter(Boolean))
    value = value.split(secret).join("[REDACTED]");
  value = value.replace(/api_[A-Za-z0-9+/_=-]+/g, "[REDACTED]");
  if (
    !/^(operation_hash|staging_operation_hash|transaction_hash|tx_hash)$/.test(
      field,
    )
  )
    value = value.replace(/0x[0-9a-fA-F]{64}\b/g, (hex) =>
      publicHex.has(hex) ? hex : "[REDACTED]",
    );
  return value;
}

// Only this tool's schema-checked synthetic staging payload is exempt from
// generic hex redaction. Never exempt an arbitrary subtree called "payload".
export function sanitizeTestData(data, secrets, action) {
  if (data && typeof data === "object" && data.payload && data.test !== true)
    throw new PortalError(
      "unexpected_test_payload",
      "The test payload is missing synthetic provenance. No payload was returned.",
    );
  if (!data || typeof data !== "object" || data.test !== true || !data.payload)
    return redact(data, secrets);
  const payload = data.payload;
  const number = { type: "number" };
  const string = { type: "string" };
  const fields = {
    identifier: { type: "string", enum: ["proof_of_human"] },
    issuer_schema_id: number,
    nullifier: string,
    signal_hash: string,
    expires_at_min: number,
    credential_genesis_issued_at_min: number,
    proof: { type: "array", items: string },
  };
  try {
    validate(
      {
        type: "object",
        additionalProperties: false,
        required: [
          "protocol_version",
          "environment",
          "action",
          "nonce",
          "responses",
        ],
        properties: {
          protocol_version: { type: "string", enum: ["4.0"] },
          environment: { type: "string", enum: ["staging"] },
          action: string,
          nonce: string,
          responses: {
            type: "array",
            items: {
              type: "object",
              properties: fields,
              required: Object.keys(fields),
              additionalProperties: false,
            },
          },
        },
      },
      payload,
    );
    const response = payload.responses[0];
    if (
      payload.action !== action ||
      payload.responses.length !== 1 ||
      !/^0x00[\da-f]{62}$/i.test(payload.nonce) ||
      !/^0x00[\da-f]{62}$/i.test(response.nullifier) ||
      response.signal_hash !== "0x0" ||
      response.issuer_schema_id !== 1 ||
      !Number.isSafeInteger(response.expires_at_min) ||
      response.expires_at_min < 0 ||
      response.credential_genesis_issued_at_min !== 0 ||
      response.proof.length !== 5 ||
      response.proof.some((p) => p !== `0x${"0".repeat(64)}`) ||
      secrets
        .filter(Boolean)
        .some((secret) => JSON.stringify(payload).includes(secret))
    )
      throw new Error();
    const publicHex = new Set([
      payload.nonce,
      response.nullifier,
      ...response.proof,
    ]);
    const safe = redact(data, secrets, "", publicHex);
    safe.payload = structuredClone(payload);
    return safe;
  } catch {
    throw new PortalError(
      "unexpected_test_payload",
      "The synthetic test payload no longer matches the supported contract. No payload was returned; update the plugin before forwarding it.",
    );
  }
}

export function sanitizeTestResult(result, secrets, action) {
  const safe = redact(result, secrets);
  if (result.structuredContent)
    safe.structuredContent = sanitizeTestData(
      result.structuredContent,
      secrets,
      action,
    );
  safe.content = (result.content || []).map((block) => {
    if (block.type !== "text") return redact(block, secrets);
    let data;
    try {
      data = JSON.parse(block.text);
    } catch {
      return redact(block, secrets);
    }
    return {
      ...redact(block, secrets),
      text: JSON.stringify(sanitizeTestData(data, secrets, action)),
    };
  });
  return safe;
}

export function validate(schema, value, label = "arguments") {
  const kind = Array.isArray(value)
    ? "array"
    : value === null
      ? "null"
      : typeof value;
  if (
    schema.type &&
    schema.type !== kind &&
    !(schema.type === "integer" && Number.isInteger(value))
  )
    throw new PortalError(
      "invalid_arguments",
      `${label} must be ${schema.type}.`,
    );
  if (schema.enum && !schema.enum.includes(value))
    throw new PortalError(
      "invalid_arguments",
      `${label} is not an accepted value.`,
    );
  if (kind === "object") {
    for (const required of schema.required || [])
      if (!Object.hasOwn(value, required))
        throw new PortalError(
          "invalid_arguments",
          `${label}.${required} is required.`,
        );
    for (const [key, entry] of Object.entries(value)) {
      if (schema.properties && Object.hasOwn(schema.properties, key))
        validate(schema.properties[key], entry, `${label}.${key}`);
      else if (schema.additionalProperties === false)
        throw new PortalError(
          "invalid_arguments",
          `${label}.${key} is not supported.`,
        );
    }
  }
  if (kind === "array" && schema.items)
    value.forEach((v, i) => validate(schema.items, v, `${label}[${i}]`));
}

const stable = (value) =>
  JSON.stringify(value, function (_key, v) {
    return v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v;
  });

export class Remote {
  constructor({ key, fetchImpl = fetch, endpoint = ENDPOINT } = {}) {
    this.key = key;
    this.fetch = fetchImpl;
    this.endpoint = endpoint;
    this.id = 0;
    this.session = null;
    this.initialized = false;
  }
  async request(method, params, notification = false) {
    const id = notification ? undefined : ++this.id;
    const headers = {
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    };
    if (this.session) headers["Mcp-Session-Id"] = this.session;
    let response;
    try {
      response = await this.fetch(this.endpoint, {
        method: "POST",
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      });
    } catch {
      throw new PortalError(
        "transport_error",
        "Portal request failed or timed out. A mutation may have completed; inspect its state before retrying.",
      );
    }
    if ([401, 403].includes(response.status))
      throw new PortalError(
        "rejected_credentials",
        "The Portal rejected the team credential.",
      );
    if (!response.ok)
      throw new PortalError(
        "server_error",
        `Portal returned HTTP ${response.status}. Inspect state before retrying a mutation.`,
      );
    if (notification) {
      await response.body?.cancel().catch(() => {});
      return;
    }
    const session = response.headers.get("mcp-session-id");
    if (session) this.session = session;
    if (!response.body)
      throw new PortalError(
        "invalid_response",
        "Portal returned an empty response.",
      );
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "",
      size = 0,
      message;
    const sse = response.headers
      .get("content-type")
      ?.includes("text/event-stream");
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > LIMIT)
          throw new PortalError(
            "invalid_response",
            "Portal response exceeded the supported size.",
          );
        buffer += decoder.decode(value, { stream: true });
        if (sse) {
          buffer = buffer.replace(/\r\n/g, "\n");
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const data = event
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.slice(5).trimStart())
              .join("\n");
            if (!data) continue;
            const candidate = JSON.parse(data);
            if (candidate.id === id) {
              message = candidate;
              break;
            }
          }
          if (message) break;
        }
      }
      if (!sse) message = JSON.parse(buffer + decoder.decode());
    } catch (e) {
      if (e instanceof PortalError) throw e;
      throw new PortalError(
        "invalid_response",
        "Portal returned an unreadable response; inspect state before retrying.",
      );
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (!message || message.id !== id || message.jsonrpc !== "2.0")
      throw new PortalError(
        "invalid_response",
        "Portal response did not match the request.",
      );
    if (message.error) {
      if (message.error.code === -32001)
        throw new PortalError(
          "rejected_credentials",
          "The Portal rejected the team credential.",
        );
      throw new PortalError(
        `remote_${message.error.code}`,
        redact(message.error.message || "Portal operation failed.", [this.key]),
        params?.name === "run_test_verification"
          ? sanitizeTestData(
              message.error.data,
              [this.key],
              params.arguments?.action,
            )
          : redact(message.error.data, [this.key]),
      );
    }
    if (!Object.hasOwn(message, "result"))
      throw new PortalError(
        "invalid_response",
        "Portal response omitted its result.",
      );
    return message.result;
  }
  async initialize() {
    if (this.initialized) return;
    await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "world-developer-local", version: "1.0.0" },
    });
    await this.request("notifications/initialized", undefined, true);
    this.initialized = true;
  }
}

const output = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});
const failure = (e) => ({
  ...output({
    status: e.code || "local_error",
    message:
      e instanceof PortalError
        ? e.message
        : "Local operation failed. No secret has been returned.",
    ...(e instanceof PortalError && e.details !== undefined
      ? { details: e.details }
      : {}),
  }),
  isError: true,
});

export class Portal {
  constructor({
    env = process.env,
    dataDir = DATA_DIR,
    remoteFactory = (key) => new Remote({ key }),
  } = {}) {
    this.env = env;
    this.dataDir = dataDir;
    this.remoteFactory = remoteFactory;
  }
  async remote() {
    const key = await credential(this.env, this.dataDir);
    const remote = this.remoteFactory(key);
    await remote.initialize();
    return remote;
  }
  async status() {
    try {
      const remote = await this.remote();
      const { tools } = await remote.request("tools/list");
      const drift = CONTRACT.filter(
        (t) =>
          !(
            OPTIONAL_TOOLS.has(t.name) && !tools?.some((r) => r.name === t.name)
          ) &&
          stable(t.inputSchema) !==
            stable(tools?.find((r) => r.name === t.name)?.inputSchema),
      ).map((t) => t.name);
      const context = await remote.request("tools/call", {
        name: "get_team_context",
        arguments: {},
      });
      if (context.isError)
        throw new PortalError(
          "team_check_failed",
          "Portal team lookup returned an error.",
        );
      return output({
        status: drift.length ? "schema_drift" : "connected",
        incompatible_tools: drift,
        available_optional_tools: [...OPTIONAL_TOOLS].filter((name) =>
          tools?.some((t) => t.name === name),
        ),
        unavailable_optional_tools: [...OPTIONAL_TOOLS].filter(
          (name) => !tools?.some((t) => t.name === name),
        ),
        authenticated_team_check: true,
      });
    } catch (e) {
      return failure(e);
    }
  }
  list() {
    const tools = CONTRACT.map((tool) => {
      const copy = structuredClone(tool);
      if (KEY_TOOLS.has(copy.name)) {
        delete copy.inputSchema.properties.signer_private_key;
        copy.description +=
          " This adapter stores a generated signing key in an owner-only local file and returns only secret_file. Existing private keys cannot be supplied through tool arguments.";
      }
      if (copy.name === "get_world_id_signing_key") {
        delete copy.inputSchema.properties.rotate_if_unavailable;
        copy.description =
          "Read the existing public signer address. Never rotates a key.";
      }
      if (OPTIONAL_TOOLS.has(copy.name))
        copy.description +=
          " Check portal_connection_status for deployed support. On older deployments this returns unsupported_tool without creating anything.";
      copy.annotations = {
        readOnlyHint: READS.has(copy.name),
        destructiveHint: copy.name === "rotate_world_id_signing_key",
        idempotentHint: READS.has(copy.name),
        openWorldHint: true,
      };
      return copy;
    });
    tools.unshift({
      name: "portal_connection_status",
      description:
        "Read-only Portal connection and contract check. Distinguishes missing/rejected credentials, network failure and tool schema drift. No team data or secrets are returned.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    });
    return { tools };
  }
  async call(name, args = {}) {
    let reservation;
    try {
      const exposed = this.list().tools.find((t) => t.name === name);
      if (!exposed)
        throw new PortalError("unknown_tool", "Unknown Portal tool.");
      validate(exposed.inputSchema, args);
      if (name === "portal_connection_status") return await this.status();
      if (name === "submit_app_for_review" && args.confirm_submission !== true)
        throw new PortalError(
          "submission_not_confirmed",
          "Submission requires confirm_submission: true for the authorized app state.",
        );
      const remote = await this.remote();
      if (!READS.has(name)) {
        const live = await remote.request("tools/list");
        const expected = CONTRACT.find((t) => t.name === name);
        if (
          OPTIONAL_TOOLS.has(name) &&
          !live.tools?.some((t) => t.name === name)
        )
          throw new PortalError(
            "unsupported_tool",
            "This Portal deployment does not expose run_test_verification yet. Use the documented SDK/device test flow; do not fabricate a synthetic payload.",
          );
        if (
          stable(expected.inputSchema) !==
          stable(live.tools?.find((t) => t.name === name)?.inputSchema)
        )
          throw new PortalError(
            "schema_drift",
            "The Portal tool schema changed. Update and validate the plugin contract before this write.",
          );
      }
      if (KEY_TOOLS.has(name)) {
        const root = await privateDirectory(this.dataDir);
        const folder = await privateDirectory(join(root, "secrets"));
        const filename = join(folder, `signing-${randomUUID()}.env`);
        const handle = await open(
          filename,
          C.O_CREAT | C.O_EXCL | C.O_WRONLY | C.O_NOFOLLOW,
          0o600,
        );
        reservation = { filename, handle };
        await handle.writeFile(
          `# Pending ${name} for ${String(args.app_id).replace(/[\r\n]/g, "")}\n`,
        );
        await handle.sync();
      }
      const result = await remote.request("tools/call", {
        name,
        arguments: args,
      });
      if (reservation) {
        const secrets = [];
        const collect = (value) => {
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (parsed && typeof parsed === "object") collect(parsed);
            } catch {}
          } else if (Array.isArray(value)) value.forEach(collect);
          else if (value && typeof value === "object")
            for (const [k, v] of Object.entries(value)) {
              if (
                /private[_-]?key/i.test(k) &&
                typeof v === "string" &&
                /^0x[0-9a-fA-F]{64}$/.test(v)
              )
                secrets.push(v);
              else collect(v);
            }
        };
        collect(result);
        const unique = [...new Set(secrets)];
        if (unique.length > 1)
          throw new PortalError(
            "key_handoff_failed",
            "Multiple signing keys returned; secure handoff could not be completed. Inspect the Portal state before any recovery.",
          );
        if (unique.length === 1) {
          // Write at offset 0, then truncate; the reserved file already has mode 0600.
          const body = `WORLD_ID_SIGNING_KEY=${unique[0]}\n`;
          await reservation.handle.write(body, 0, "utf8");
          await reservation.handle.truncate(Buffer.byteLength(body));
          await reservation.handle.sync();
          const safe = redact(result, [remote.key, ...unique]);
          safe.content = [
            ...(safe.content || []),
            {
              type: "text",
              text: JSON.stringify({
                secret_file: reservation.filename,
                variable: "WORLD_ID_SIGNING_KEY",
                app_id: args.app_id,
              }),
            },
          ];
          return safe;
        }
        if (!result.isError)
          throw new PortalError(
            "key_handoff_failed",
            "No signing key returned. Inspect the app registration before retrying; no key was invented or rotated.",
          );
      }
      return name === "run_test_verification"
        ? sanitizeTestResult(result, [remote.key], args.action)
        : redact(result, [remote.key]);
    } catch (e) {
      if (reservation)
        return failure(
          new PortalError(
            "key_operation_uncertain",
            `Signing operation or secret handoff did not complete cleanly. Inspect Portal state before retrying. Recovery reservation: ${reservation.filename}. Cause: ${e instanceof PortalError ? e.code : "local_storage_error"}`,
          ),
        );
      return failure(e);
    } finally {
      await reservation?.handle.close().catch(() => {});
    }
  }
}

export async function serve(
  portal = new Portal(),
  input = process.stdin,
  stdout = process.stdout,
) {
  const lines = createInterface({ input, crlfDelay: Infinity });
  // Serialize requests: signing and configuration writes must not race through one adapter.
  for await (const line of lines) {
    let request, response;
    try {
      if (Buffer.byteLength(line) > LIMIT) throw new Error("oversize");
      request = JSON.parse(line);
      if (
        !request ||
        Array.isArray(request) ||
        typeof request !== "object" ||
        request.jsonrpc !== "2.0"
      ) {
        response = {
          error: { code: -32600, message: "Invalid JSON-RPC request." },
        };
      } else if (!Object.hasOwn(request, "id")) continue;
      else if (request.method === "initialize")
        response = {
          result: {
            protocolVersion: "2025-06-18",
            capabilities: { tools: {} },
            serverInfo: { name: "world-portal", version: "1.0.0" },
            instructions:
              "Use live tool schemas. Portal connection is optional for documentation. Generated signing keys are stored locally and returned only as secret_file references. Use the world-portal skill for operations.",
          },
        };
      else if (request.method === "ping") response = { result: {} };
      else if (request.method === "tools/list")
        response = { result: portal.list() };
      else if (request.method === "resources/list")
        response = { result: { resources: [] } };
      else if (request.method === "resources/templates/list")
        response = { result: { resourceTemplates: [] } };
      else if (request.method === "tools/call")
        response = {
          result: await portal.call(
            request.params?.name,
            request.params?.arguments,
          ),
        };
      else
        response = {
          error: { code: -32601, message: "Method not supported." },
        };
    } catch {
      response = {
        error: { code: -32700, message: "Invalid JSON-RPC input." },
      };
    }
    stdout.write(
      JSON.stringify({ jsonrpc: "2.0", id: request?.id ?? null, ...response }) +
        "\n",
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === "doctor") {
    const result = await new Portal().status();
    process.stdout.write(result.content[0].text + "\n");
    process.exitCode = result.isError ? 1 : 0;
  } else await serve();
}
