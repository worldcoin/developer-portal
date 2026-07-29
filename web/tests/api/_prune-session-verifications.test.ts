import { POST } from "@/api/_prune-session-verifications";
import { logger } from "@/lib/logger";
import { print } from "graphql";
import { NextRequest } from "next/server";

// #region Mocks
const mockGraphqlRequest = jest.fn();

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({
    request: (...args: unknown[]) => mockGraphqlRequest(...args),
  }),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const createRequest = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_prune-session-verifications", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });

const pruneFloor = {
  key: "pruned_through",
  timestamp_value: "2026-06-29T12:00:00.000Z",
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
});

// #region Authentication
describe("/api/_prune-session-verifications [auth]", () => {
  it.each([undefined, "Bearer wrong"])(
    "rejects a missing or wrong secret without calling Hasura",
    async (authorization) => {
      const response = (await POST(createRequest(authorization)))!;

      expect(response.status).toBe(403);
      expect(mockGraphqlRequest).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Prune outcomes
describe("/api/_prune-session-verifications [outcomes]", () => {
  it("calls the mutation once and returns the recorded prune floor", async () => {
    mockGraphqlRequest.mockResolvedValue({
      prune_session_verifications: [pruneFloor],
    });

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      pruned_through: pruneFloor,
    });
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    const pruneOperation = print(mockGraphqlRequest.mock.calls[0][0]);
    expect(pruneOperation).toContain("mutation PruneSessionVerifications");
    expect(pruneOperation).toContain("prune_session_verifications");
    expect(logger.info).toHaveBeenCalledWith(
      "Pruned v4 session verification analytics",
      { prunedThrough: pruneFloor },
    );
  });

  it("returns a distinct no-op response when no prune floor was written", async () => {
    mockGraphqlRequest.mockResolvedValue({
      prune_session_verifications: [],
    });

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      pruned_through: null,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("fails cleanly without returning mutation internals", async () => {
    mockGraphqlRequest.mockRejectedValue(new Error("Hasura secret detail"));

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "Session verification prune failed",
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });
});
// #endregion
