import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import {
  getRpFromContract,
  sendUserOperation,
} from "@/api/helpers/temporal-rpc";
import {
  buildUserOperation,
  hashSafeUserOp,
  hashUserOperation,
} from "@/api/helpers/user-operation";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));
// #endregion

// #region Test data
const sender = "0x1111111111111111111111111111111111111111";
const entryPoint = "0x2222222222222222222222222222222222222222";
const operation = () =>
  buildUserOperation(
    sender,
    "0x1234",
    new Uint8Array(32),
    new Date("2026-01-01Z"),
    new Date("2026-01-02Z"),
  );
let server: Server;
let requests: string[];
// #endregion

beforeEach(async () => {
  requests = [];
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      requests.push(JSON.parse(body).method);
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": "0",
      });
      res.end(JSON.stringify({ error: "limited" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.TEMPORAL_RPC_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// #region Receipt identity and one-shot RPC
describe("reservation RPC guarantees (loopback only)", () => {
  it("never retries a throttled submission or a one-shot scan read", async () => {
    await expect(sendUserOperation(operation(), entryPoint)).rejects.toThrow();
    expect(requests).toEqual(["eth_sendUserOperation"]);
    requests = [];
    await expect(getRpFromContract(1n, sender, false)).rejects.toThrow();
    expect(requests).toEqual(["eth_call"]);
  });

  it("uses the EntryPoint receipt hash, distinct from the Safe signing digest", () => {
    const op = operation();
    const hash = hashUserOperation(op, entryPoint, 480);
    expect(hash).toBe(
      "0x6ec2e6ee95efcb94895072c2c6a4048d5c63c697bb80c872c8972de5c3c13a4e",
    );
    expect(hash).not.toBe(hashSafeUserOp(op, 480, sender, entryPoint));
    expect(
      hashUserOperation({ ...op, signature: "0x1234" }, entryPoint, 480),
    ).toBe(hash);
    expect(
      hashUserOperation({ ...op, callData: "0x1235" }, entryPoint, 480),
    ).not.toBe(hash);
  });
});
// #endregion
