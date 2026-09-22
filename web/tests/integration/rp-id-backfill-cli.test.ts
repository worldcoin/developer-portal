import { spawn, ChildProcess } from "node:child_process";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { Client } from "pg";
import {
  Interface,
  SigningKey,
  computeAddress,
  recoverAddress,
  getBytes,
} from "ethers";
import {
  hashSafeUserOp,
  hashUserOperation,
  UserOperation,
} from "@/api/helpers/user-operation";
import RP_ABI from "@/api/helpers/abi/rp-registry.json";
import SAFE_ABI from "@/api/helpers/abi/safe-4337.json";

// #region I/O fixtures. No helper is mocked: real CLI, Postgres, RPC, AWS SDK, and KMS DER parsing.
// Fixed PUBLIC TEST KEYS, only usable against the loopback mock server.
const owner = new SigningKey(`0x${"01".repeat(32)}`);
const manager = new SigningKey(`0x${"02".repeat(32)}`);
const addresses = {
  production: "0x1111111111111111111111111111111111111111",
  staging: "0x2222222222222222222222222222222222222222",
  safe: "0x3333333333333333333333333333333333333333",
  entryPoint: "0x4444444444444444444444444444444444444444",
  module: "0x5555555555555555555555555555555555555555",
};
const enabled = process.env.RUN_RP_BACKFILL_CLI_TESTS === "1";
const connectionString = process.env.RP_TEST_DATABASE_URL;
const db = new Client({ connectionString });
let fixturesCreated = false;
const teamId = "team_c11fff00000000000000000000000000";
const appId = (n: number) => `app_c11fff${n.toString(16).padStart(26, "0")}`;
const rpInterface = new Interface(RP_ABI);
const safeInterface = new Interface(SAFE_ABI);
let server: Server;
let baseUrl: string;
let child: ChildProcess | undefined;
let mode: "success" | "lost" | "kill" | "scan_failure" | "timeout";
let rpcMethods: string[];
let kmsMethods: string[];
let submitted: string[];
let errors: unknown[];
const chain = new Map<string, readonly unknown[]>();
const receipts = new Map<string, { userOpHash: string; success: boolean }>();
const key = (address: string, id: bigint) => `${address.toLowerCase()}:${id}`;
const toDer = (value: string) => {
  let bytes = Buffer.from(value.slice(2), "hex");
  while (bytes.length > 1 && bytes[0] === 0) bytes = bytes.subarray(1);
  if (bytes[0] & 0x80) bytes = Buffer.concat([Buffer.from([0]), bytes]);
  return Buffer.concat([Buffer.from([2, bytes.length]), bytes]);
};

async function rpc(method: string, params: any[]) {
  rpcMethods.push(method);
  if (method === "eth_call") {
    if (mode === "scan_failure") throw new Error("scan RPC failed");
    const { to, data } = params[0];
    const [id] = rpInterface.decodeFunctionData("getRpUnchecked", data);
    return rpInterface.encodeFunctionResult("getRpUnchecked", [
      chain.get(key(to, id)) ?? [
        false,
        false,
        addresses.safe,
        addresses.safe,
        0n,
        "",
      ],
    ]);
  }
  if (method === "eth_estimateGas") return "0x100000";
  if (method === "eth_getUserOperationReceipt")
    return receipts.get(params[0]) ?? null;
  if (method !== "eth_sendUserOperation")
    throw new Error(`Unexpected RPC: ${method}`);
  const [op, entryPoint] = params as [UserOperation, string];
  const hash = hashUserOperation(op, entryPoint, 480);
  const tracked = await db.query(
    "SELECT * FROM rp_id_backfill WHERE production_request_id = $1 OR staging_request_id = $1",
    [hash],
  );
  const [to, , data] = safeInterface.decodeFunctionData(
    "executeUserOp",
    op.callData,
  );
  const [ids, managers, signers, domains] = rpInterface.decodeFunctionData(
    "registerMany",
    data,
  );
  expect(tracked.rowCount).toBe(ids.length);
  expect(
    recoverAddress(
      hashSafeUserOp(op, 480, addresses.module, entryPoint),
      `0x${op.signature.slice(26)}`,
    ),
  ).toBe(computeAddress(owner.publicKey));
  expect(op.maxFeePerGas).toBe("0x0");
  expect(op.maxPriorityFeePerGas).toBe("0x0");
  for (let i = 0; i < ids.length; i++) {
    expect(managers[i]).toBe(computeAddress(manager.publicKey));
    expect(domains[i]).toBe("");
    chain.set(key(to, ids[i]), [
      true,
      true,
      managers[i],
      signers[i],
      ids[i],
      domains[i],
    ]);
  }
  submitted.push(hash);
  if (mode === "kill" && submitted.length === 1) child!.kill("SIGKILL");
  if (mode !== "timeout" || submitted.length !== 1)
    receipts.set(hash, { userOpHash: hash, success: true });
  return hash;
}

function cli(args: string[]) {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    NODE_ENV: "test",
    GENERAL_SECRET_KEY: "local-cli-test-only",
    DD_TRACE_ENABLED: "false",
    RP_BACKFILL_DATABASE_URL: connectionString,
    RP_SETUP_PAUSED: "true",
    AWS_ACCESS_KEY_ID: "local-only",
    AWS_SECRET_ACCESS_KEY: "local-only",
    AWS_EC2_METADATA_DISABLED: "true",
    AWS_ENDPOINT_URL_KMS: baseUrl,
    AWS_ENDPOINT_URL: baseUrl,
    AWS_REGION_NAME: "us-east-1",
    AWS_MAX_ATTEMPTS: "1",
    TEMPORAL_RPC_URL: baseUrl,
    RP_REGISTRY_KMS_REGION: "us-east-1",
    RP_REGISTRY_MANAGER_KMS_KEY_ID: "local-manager",
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "local-owner",
    RP_REGISTRY_CONTRACT_ADDRESS: addresses.production,
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS: addresses.staging,
    RP_REGISTRY_SAFE_ADDRESS: addresses.safe,
    RP_REGISTRY_ENTRYPOINT_ADDRESS: addresses.entryPoint,
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS: addresses.module,
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS: addresses.production,
    RP_REGISTRY_DOMAIN_SEPARATOR: `0x${"11".repeat(32)}`,
    RP_REGISTRY_UPDATE_RP_TYPEHASH: `0x${"22".repeat(32)}`,
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: `0x${"33".repeat(32)}`,
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: `0x${"44".repeat(32)}`,
  };
  child = spawn(
    process.execPath,
    [
      "--conditions=react-server",
      "--require",
      resolve("tests/fixtures/rp-local-network.cjs"),
      "--import",
      "tsx",
      "scripts/rp-id-backfill.ts",
      ...args,
    ],
    { cwd: process.cwd(), env },
  );
  const running = child;
  return new Promise<{
    code: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    let stdout = "",
      stderr = "";
    running.stdout!.on("data", (data) => {
      stdout += data;
    });
    running.stderr!.on("data", (data) => {
      stderr += data;
    });
    running.on("error", reject);
    running.on("close", (code, signal) => {
      if (child === running) child = undefined;
      resolve({ code, signal, stdout, stderr });
    });
  });
}
const scanArgs = ["scan", "--cutoff", "1701-01-01T00:00:00Z"];
const reserveArgs = [
  "reserve",
  "--confirm-setup-paused",
  "--confirm-setup-drained",
];
async function cohort(count: number) {
  for (let i = 0; i < count; i++) {
    const { rows } = await db.query(
      "INSERT INTO app(team_id, name, is_staging, created_at) VALUES ($1, 'CLI test', false, '1700-01-01') RETURNING id",
      [teamId],
    );
    await db.query("UPDATE app SET id = $1 WHERE id = $2", [
      appId(i),
      rows[0].id,
    ]);
  }
}
// #endregion

(enabled ? describe : describe.skip)(
  "reservation CLI over real loopback RPC/KMS",
  () => {
    beforeAll(async () => {
      if (
        !connectionString ||
        !["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname)
      )
        throw new Error("Explicit loopback RP_TEST_DATABASE_URL required");
      await db.connect();
      if ((await db.query("SELECT 1 FROM rp_id_backfill LIMIT 1")).rowCount)
        throw new Error("CLI suite requires an empty disposable worklist");
      await db.query(
        "INSERT INTO team(id, name) VALUES ($1, 'CLI reservation tests')",
        [teamId],
      );
      fixturesCreated = true;
    });
    beforeEach(async () => {
      mode = "success";
      rpcMethods = [];
      kmsMethods = [];
      submitted = [];
      errors = [];
      chain.clear();
      receipts.clear();
      server = createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const request = JSON.parse(body);
            res.setHeader("Content-Type", "application/json");
            const target = req.headers["x-amz-target"] as string | undefined;
            if (target) {
              kmsMethods.push(target);
              const signingKey =
                request.KeyId === "local-manager" ? manager : owner;
              if (target.endsWith("GetPublicKey")) {
                const der = Buffer.concat([
                  Buffer.from(
                    "3056301006072a8648ce3d020106052b8104000a034200",
                    "hex",
                  ),
                  Buffer.from(getBytes(signingKey.publicKey)),
                ]);
                res.end(
                  JSON.stringify({
                    KeyId: request.KeyId,
                    PublicKey: der.toString("base64"),
                    KeySpec: "ECC_SECG_P256K1",
                    KeyUsage: "SIGN_VERIFY",
                    SigningAlgorithms: ["ECDSA_SHA_256"],
                  }),
                );
              } else if (target.endsWith("Sign")) {
                expect(request.MessageType).toBe("DIGEST");
                const signature = signingKey.sign(
                  Buffer.from(request.Message, "base64"),
                );
                const rs = Buffer.concat([
                  toDer(signature.r),
                  toDer(signature.s),
                ]);
                res.end(
                  JSON.stringify({
                    KeyId: request.KeyId,
                    Signature: Buffer.concat([
                      Buffer.from([0x30, rs.length]),
                      rs,
                    ]).toString("base64"),
                    SigningAlgorithm: "ECDSA_SHA_256",
                  }),
                );
              } else throw new Error(`Unexpected KMS action ${target}`);
              return;
            }
            const result = await rpc(request.method, request.params);
            if (
              mode === "lost" &&
              request.method === "eth_sendUserOperation" &&
              submitted.length === 1
            ) {
              req.socket.destroy();
              return;
            }
            res.end(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }));
          } catch (error) {
            if (mode !== "scan_failure") errors.push(error);
            res.statusCode = 503;
            res.end(JSON.stringify({ error: String(error) }));
          }
        });
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    afterEach(async () => {
      if (!fixturesCreated) return;
      child?.kill("SIGKILL");
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.query(
        "DELETE FROM rp_id_backfill WHERE app_id LIKE 'app_c11fff%'",
      );
      await db.query("DELETE FROM app WHERE team_id = $1", [teamId]);
      expect(errors).toEqual([]);
    });
    afterAll(async () => {
      if (fixturesCreated)
        await db.query("DELETE FROM team WHERE id = $1", [teamId]);
      await db.end();
    });

    it("runs scan and reserve as real commands with KMS DER signing and persisted receipt hashes", async () => {
      await cohort(101);
      const scanned = await cli(scanArgs);
      if (scanned.code !== 0) throw new Error(scanned.stderr);
      expect(scanned).toMatchObject({
        code: 0,
        stdout: expect.stringContaining('"count": 101'),
      });
      expect(rpcMethods).toHaveLength(202);
      expect(kmsMethods).toHaveLength(0);
      const result = await cli(reserveArgs);
      expect(result).toMatchObject({
        code: 0,
        stdout: expect.stringContaining('"outcome": "complete"'),
      });
      expect(submitted).toHaveLength(4);
      expect(
        kmsMethods.filter((method) => method.endsWith("Sign")),
      ).toHaveLength(4);
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM rp_id_backfill WHERE production_status = 'reserved' AND staging_status = 'reserved'",
          )
        ).rows[0].count,
      ).toBe(101);
      expect(await cli(scanArgs)).toMatchObject({
        code: 1,
        stderr: expect.stringContaining("already initialized"),
      });
    }, 30_000);

    it("a failing scan reads once, writes nothing, and can be rerun with the same cutoff", async () => {
      await cohort(1);
      mode = "scan_failure";
      expect(await cli(scanArgs)).toMatchObject({ code: 1 });
      expect(rpcMethods).toEqual(["eth_call"]);
      expect((await db.query("SELECT 1 FROM rp_id_backfill")).rowCount).toBe(0);
      mode = "success";
      expect(await cli(scanArgs)).toMatchObject({ code: 0 });
    }, 15_000);

    it.each(["lost", "kill"] as const)(
      "preserves an accepted request after %s and skips it in a new process",
      async (scenario) => {
        await cohort(101);
        expect(await cli(scanArgs)).toMatchObject({ code: 0 });
        mode = scenario;
        const first = await cli(reserveArgs);
        if (scenario === "kill") expect(first.signal).toBe("SIGKILL");
        else expect(first.stdout).toContain('"outcome": "unresolved"');
        const unresolved = await db.query(
          "SELECT DISTINCT production_request_id AS hash FROM rp_id_backfill WHERE production_status = 'in_progress'",
        );
        expect(unresolved.rows).toEqual([{ hash: submitted[0] }]);
        expect(
          (
            await db.query(
              "SELECT count(*)::int AS count FROM rp_id_backfill WHERE production_status = 'in_progress'",
            )
          ).rows[0].count,
        ).toBe(100);
        const previousHash = submitted[0];
        mode = "success";
        const second = await cli(reserveArgs);
        expect(second).toMatchObject({
          code: 0,
          stdout: expect.stringContaining(previousHash),
        });
        expect(submitted.filter((hash) => hash === previousHash)).toHaveLength(
          1,
        );
      },
      30_000,
    );

    it("rejects missing drain confirmation before contacting KMS or RPC", async () => {
      expect(await cli(["reserve", "--confirm-setup-paused"])).toMatchObject({
        code: 1,
        stderr: expect.stringContaining("earlier setup submissions"),
      });
      expect(rpcMethods).toHaveLength(0);
      expect(kmsMethods).toHaveLength(0);
    }, 15_000);

    it("honors the real 120-second confirmation bound and then advances", async () => {
      await cohort(101);
      expect(await cli(scanArgs)).toMatchObject({ code: 0 });
      mode = "timeout";
      const start = Date.now();
      const result = await cli(reserveArgs);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(120_000);
      expect(elapsed).toBeLessThan(135_000);
      expect(result).toMatchObject({
        code: 0,
        stdout: expect.stringContaining('"outcome": "unresolved"'),
      });
      expect(submitted).toHaveLength(4);
      expect(
        rpcMethods.filter((method) => method === "eth_sendUserOperation"),
      ).toHaveLength(4);
    }, 150_000);
  },
);
