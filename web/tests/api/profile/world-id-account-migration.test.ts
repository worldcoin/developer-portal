import { POST } from "@/api/profile/world-id-account-migration";
import { NextRequest } from "next/server";

// #region Mocks
const getSessionMock = jest.fn();
const FetchUserByWorldIdNullifier = jest.fn();
const MergeWorldIdAccounts = jest.fn();
const verifyProofMock = jest.fn();

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
  toSessionRequest: (req: NextRequest) => req,
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/api/profile/world-id-account-migration/graphql/fetch-user-by-world-id-nullifier.generated",
  () => ({
    getSdk: () => ({ FetchUserByWorldIdNullifier }),
  }),
);

jest.mock(
  "@/api/profile/world-id-account-migration/graphql/merge-world-id-accounts.generated",
  () => ({
    getSdk: () => ({ MergeWorldIdAccounts }),
  }),
);

jest.mock("@/api/helpers/verify", () => ({
  normalizeNullifierHash: jest.fn((value: string) => {
    const normalized = value.toLowerCase().replace(/^0x/, "");
    return `0x${normalized}`;
  }),
  verifyProof: (...args: unknown[]) => verifyProofMock(...args),
}));

jest.mock("@/lib/hashing", () => ({
  generateExternalNullifier: jest.fn(() => ({ digest: "0xexternal" })),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
// #endregion

// #region Test Data
const currentUserId = "usr_current";
const legacyUserId = "usr_legacy";
const nullifier = "0xABC123";
const normalizedNullifier = "0xabc123";
const signalHash = "0xsignal";

const createRequest = (body?: unknown) =>
  new NextRequest(
    "http://localhost:3000/api/profile/world-id-account-migration",
    {
      method: body ? "POST" : "GET",
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );

const makeSession = () => ({
  user: {
    sub: "email|user@example.com",
    email: "user@example.com",
    email_verified: true,
    hasura: {
      id: currentUserId,
    },
  },
});

const makeProof = (overrides: Record<string, unknown> = {}) => ({
  proof: "0xproof",
  merkle_root: "0xroot",
  nullifier,
  signal_hash: signalHash,
  verification_level: "device",
  ...overrides,
});

const makeMatchedUser = (
  id: string,
  overrides: {
    world_id_nullifier?: string;
    memberships?: { id: string; team_id: string; role: string }[];
  } = {},
) => ({
  id,
  email: `${id}@test.dev`,
  name: id,
  auth0Id: `oauth2|worldcoin|${normalizedNullifier}`,
  world_id_nullifier: overrides.world_id_nullifier ?? normalizedNullifier,
  memberships: overrides.memberships ?? [],
});

const makeCurrentUser = (
  overrides: {
    world_id_nullifier?: string | null;
    memberships?: { id: string; team_id: string; role: string }[];
  } = {},
) => ({
  id: currentUserId,
  world_id_nullifier: overrides.world_id_nullifier ?? null,
  memberships: overrides.memberships ?? [],
});

const mockLookup = (
  users: ReturnType<typeof makeMatchedUser>[],
  current_user: ReturnType<typeof makeCurrentUser> | null = makeCurrentUser(),
) => {
  FetchUserByWorldIdNullifier.mockResolvedValue({ user: users, current_user });
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_ENV = "production";
  process.env.NEXT_PUBLIC_ENABLE_WORLD_ID_RESTORATION = "true";

  getSessionMock.mockResolvedValue(makeSession());
  mockLookup([]);
  MergeWorldIdAccounts.mockResolvedValue({
    merge_world_id_accounts: [
      { id: currentUserId, world_id_nullifier: normalizedNullifier },
    ],
  });
  verifyProofMock.mockResolvedValue({ success: true });
});

// #region Request guards
describe("/api/profile/world-id-account-migration [request guards]", () => {
  it("rejects unauthenticated requests before verification", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("unauthenticated");
    expect(verifyProofMock).not.toHaveBeenCalled();
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("rejects a payload missing a required proof field before verification", async () => {
    const response = await POST(createRequest(makeProof({ proof: undefined })));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      code: "invalid_request",
      attribute: "proof",
    });
    expect(verifyProofMock).not.toHaveBeenCalled();
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("rejects Sign in with World ID sessions before verification", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        ...makeSession().user,
        sub: `oauth2|worldcoin|${normalizedNullifier}`,
      },
    });

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("world_id_session");
    expect(verifyProofMock).not.toHaveBeenCalled();
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("returns 503 without verifying or writing when the feature flag is off", async () => {
    delete process.env.NEXT_PUBLIC_ENABLE_WORLD_ID_RESTORATION;

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe("restoration_disabled");
    expect(verifyProofMock).not.toHaveBeenCalled();
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("returns the verification error without writing when the proof is invalid", async () => {
    verifyProofMock.mockResolvedValue({
      error: {
        statusCode: 400,
        code: "invalid_proof",
        message: "Proof is invalid.",
        attribute: null,
      },
    });

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("invalid_proof");
    expect(FetchUserByWorldIdNullifier).not.toHaveBeenCalled();
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });
});
// #endregion

// #region No legacy account
describe("/api/profile/world-id-account-migration [no legacy account]", () => {
  it("verifies the proof as a device-legacy proof and returns not_found without writing", async () => {
    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "not_found" });

    expect(verifyProofMock).toHaveBeenCalledWith(
      {
        signal_hash: signalHash,
        proof: "0xproof",
        merkle_root: "0xroot",
        nullifier_hash: nullifier,
        external_nullifier: "0xexternal",
      },
      {
        is_staging: false,
        verification_level: "device",
      },
    );
    expect(FetchUserByWorldIdNullifier).toHaveBeenCalledWith({
      world_id_nullifiers: [nullifier, normalizedNullifier, "abc123"],
      current_user_id: currentUserId,
    });
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("returns not_found without writing even when the current user holds a different World ID", async () => {
    mockLookup([], makeCurrentUser({ world_id_nullifier: "0xother" }));

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "not_found" });
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Merge
describe("/api/profile/world-id-account-migration [merge]", () => {
  it("merges a legacy account through the merge_world_id_accounts function", async () => {
    mockLookup([
      makeMatchedUser(legacyUserId, {
        memberships: [
          { id: "memb_1", team_id: "team_shared", role: "OWNER" },
          { id: "memb_2", team_id: "team_other", role: "MEMBER" },
        ],
      }),
    ]);

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "merged" });
    expect(MergeWorldIdAccounts).toHaveBeenCalledWith({
      current_user_id: currentUserId,
      legacy_user_id: legacyUserId,
      world_id_nullifier: normalizedNullifier,
    });
  });

  it("merges even when the current user already holds the same nullifier", async () => {
    mockLookup(
      [
        makeMatchedUser(currentUserId),
        makeMatchedUser(legacyUserId, { world_id_nullifier: nullifier }),
      ],
      makeCurrentUser({ world_id_nullifier: normalizedNullifier }),
    );

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "merged" });
    expect(MergeWorldIdAccounts).toHaveBeenCalledWith({
      current_user_id: currentUserId,
      legacy_user_id: legacyUserId,
      world_id_nullifier: normalizedNullifier,
    });
  });

  it("returns migration_failed when the merge function throws", async () => {
    mockLookup([makeMatchedUser(legacyUserId)]);
    MergeWorldIdAccounts.mockRejectedValue(new Error("merge failed"));

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("migration_failed");
  });
});
// #endregion

// #region No-op and conflict guards
describe("/api/profile/world-id-account-migration [no-op and conflicts]", () => {
  it("returns already_linked without writing when the nullifier is only on the current user", async () => {
    mockLookup(
      [makeMatchedUser(currentUserId)],
      makeCurrentUser({ world_id_nullifier: normalizedNullifier }),
    );

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "already_linked" });
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("aborts with migration_conflict when more than one legacy account matches", async () => {
    mockLookup([
      makeMatchedUser("usr_legacy_1"),
      makeMatchedUser("usr_legacy_2"),
    ]);

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("migration_conflict");
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });

  it("aborts with already_linked_other when the current user holds a different World ID", async () => {
    mockLookup(
      [makeMatchedUser(legacyUserId)],
      makeCurrentUser({ world_id_nullifier: "0xother" }),
    );

    const response = await POST(createRequest(makeProof()));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("already_linked_other");
    expect(MergeWorldIdAccounts).not.toHaveBeenCalled();
  });
});
// #endregion
