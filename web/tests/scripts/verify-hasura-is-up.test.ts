import { spawnSync } from "node:child_process";
import path from "node:path";
import { waitForHasura } from "../verifyHasuraIsUp";

// #region Test data
const options = {
  url: "http://localhost:8081/v1/graphql",
  adminSecret: "test-secret",
  timeoutMs: 1_000,
  requestTimeoutMs: 100,
};
const readyData = { data: { app: [], action: [], auth_code: [], invite: [] } };
const readyResponse = () => new Response(JSON.stringify(readyData));
// #endregion

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(global, "fetch");
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// #region Readiness and bounded retries
describe("Hasura integration readiness", () => {
  it("checks the migrated tables with an authenticated GraphQL query", async () => {
    jest.mocked(fetch).mockResolvedValue(readyResponse());

    await waitForHasura(options);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      options.url,
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": options.adminSecret,
        },
      }),
    );
    const body = JSON.parse(
      jest.mocked(fetch).mock.calls[0][1]!.body as string,
    );
    expect(body.query).toContain("auth_code(limit: 1)");
    expect(body.query).toContain("invite(limit: 1)");
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([
    ["HTTP 503", () => new Response("Unavailable", { status: 503 })],
    [
      "GraphQL errors in HTTP 200",
      () =>
        new Response(
          JSON.stringify({
            ...readyData,
            errors: [{ message: "database unavailable" }],
          }),
        ),
    ],
    ["missing schema data", () => new Response(JSON.stringify({ data: {} }))],
    ["invalid JSON", () => new Response("not JSON")],
  ])(
    "waits through %s before accepting a successful query",
    async (_, response) => {
      jest
        .mocked(fetch)
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(readyResponse());

      const waiting = waitForHasura(options);
      await jest.runAllTimersAsync();
      await waiting;

      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it("recovers after a dropped socket", async () => {
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(
        new TypeError("fetch failed", {
          cause: Object.assign(new Error("other side closed"), {
            code: "UND_ERR_SOCKET",
          }),
        }),
      )
      .mockResolvedValueOnce(readyResponse());

    const waiting = waitForHasura(options);
    await jest.runAllTimersAsync();
    await waiting;

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        dependency: "hasura",
        cause: "UND_ERR_SOCKET",
      }),
    );
  });

  it("bounds a stalled response body and retries", async () => {
    jest
      .mocked(fetch)
      .mockImplementationOnce(
        async (_, init) =>
          ({
            ok: true,
            status: 200,
            json: () =>
              new Promise((_, reject) => {
                init!.signal!.addEventListener(
                  "abort",
                  () => reject(init!.signal!.reason),
                  { once: true },
                );
              }),
          }) as Response,
      )
      .mockResolvedValueOnce(readyResponse());

    const waiting = waitForHasura(options);
    await jest.runAllTimersAsync();
    await waiting;

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ failureClass: "timeout" }),
    );
  });

  it("stops retrying at the total deadline", async () => {
    jest.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
    const startedAt = Date.now();

    const rejected = expect(waitForHasura(options)).rejects.toThrow(
      "Hasura GraphQL did not become ready within 1000ms",
    );
    await jest.runAllTimersAsync();
    await rejected;

    expect(Date.now() - startedAt).toBe(options.timeoutMs);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("keeps a real Node process alive until a stalled request fails", () => {
    const script = path.resolve(__dirname, "../verifyHasuraIsUp.js");
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `
      const { waitForHasura } = require(${JSON.stringify(script)});
      global.fetch = (_, { signal }) => new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
      waitForHasura({ ...${JSON.stringify(options)}, timeoutMs: 100 }).catch(error => {
        console.error(error.message);
        process.exitCode = 1;
      });
    `,
      ],
      { encoding: "utf8", timeout: 3_000 },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("did not become ready within 100ms");
  });
});
// #endregion
