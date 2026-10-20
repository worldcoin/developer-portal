import { isSessionProofRequest, schema } from "@/api/v4/verify/request-schema";
import { Nullifier } from "@worldcoin/idkit-server/nullifier";

// #region Test Data
const field = (value: bigint) => value.toString(16).padStart(64, "0");
const modulus =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const sessionId = (commitment = 3n, seedPrefix = "01") =>
  `session_${field(commitment)}${seedPrefix}${"00".repeat(31)}`;
const makeItem = () => ({
  identifier: "selfie",
  issuer_schema_id: 11,
  nullifier: "0x02",
  expires_at_min: 1700000000,
  proof: ["1", "2", "3", "4", "5"],
  sybil_score: 10,
});
const makeRequest = () => ({
  protocol_version: "4.0",
  nonce: "0x01",
  action: "enroll",
  session_id: sessionId(),
  responses: [makeItem()],
});
const makeSessionItem = () => {
  const { nullifier, ...item } = makeItem();
  return { ...item, session_nullifier: [nullifier, "0x02"] };
};
// #endregion

// #region Bound uniqueness classification and validation
describe("session-bound uniqueness request schema", () => {
  it("preserves action, session and parsed uniqueness nullifier with Self Check claims", async () => {
    const parsed = await schema.validate(makeRequest(), { stripUnknown: true });
    expect(isSessionProofRequest(parsed)).toBe(false);
    expect(parsed).toMatchObject({ action: "enroll", session_id: sessionId() });
    expect(parsed.responses[0]).toMatchObject({
      signal_hash: "0x0",
      sybil_score: 10,
    });
    expect(parsed.responses[0].nullifier).toBeInstanceOf(Nullifier);
    expect(parsed.responses[0].nullifier.toHex()).toBe(`0x${field(2n)}`);
  });

  it("keeps ordinary uniqueness and existing session-only formats on their original paths", async () => {
    const { session_id, ...uniqueness } = makeRequest();
    const parsedUniqueness = await schema.validate(uniqueness);
    expect(parsedUniqueness.session_id).toBeUndefined();
    expect(isSessionProofRequest(parsedUniqueness)).toBe(false);

    const { action, ...session } = makeRequest();
    const parsedSession = await schema.validate({
      ...session,
      session_id: "session_test",
      responses: [makeSessionItem()],
    });
    expect(parsedSession.action).toBeUndefined();
    expect(isSessionProofRequest(parsedSession)).toBe(true);
    expect(parsedSession.responses[0].session_nullifier).toEqual([
      "0x02",
      "0x02",
    ]);
  });

  it("does not classify an empty action as an omitted action", async () => {
    const request = {
      ...makeRequest(),
      action: "",
      responses: [makeSessionItem()],
    };
    expect(isSessionProofRequest(request)).toBe(false);
    await expect(schema.validate(request)).rejects.toThrow(
      "action is required for uniqueness proofs",
    );
  });

  it("rejects binding a v3 proof to a session", async () => {
    await expect(
      schema.validate({
        ...makeRequest(),
        protocol_version: "3.0",
        responses: [
          {
            identifier: "orb",
            nullifier: "0x02",
            merkle_root: "0x03",
            proof: "0x04",
          },
        ],
      }),
    ).rejects.toThrow("session proofs require protocol_version 4.0");
  });

  it.each([
    ["missing prefix", sessionId().slice(8)],
    ["short encoding", "session_bad"],
    ["invalid hex", `session_${"z".repeat(128)}`],
    ["zero commitment", sessionId(0n)],
    ["out-of-field commitment", sessionId(modulus)],
    ["wrong seed prefix", sessionId(3n, "02")],
    ["numeric legacy representation", "3"],
  ])("rejects %s for a newly bound session", async (_name, session_id) => {
    await expect(
      schema.validate({ ...makeRequest(), session_id }),
    ).rejects.toThrow("Invalid session_id for bound uniqueness proof");
  });

  it("rejects an empty session id rather than dropping the requested binding", async () => {
    await expect(
      schema.validate({ ...makeRequest(), session_id: "" }),
    ).rejects.toThrow("session_id must not be empty");
  });

  it("accepts the highest field commitment and a full-width nullifier", async () => {
    const parsed = await schema.validate({
      ...makeRequest(),
      session_id: sessionId(modulus - 1n),
      responses: [{ ...makeItem(), nullifier: `0x${field(modulus - 1n)}` }],
    });
    expect(parsed.session_id).toBe(sessionId(modulus - 1n));
    expect(parsed.responses[0].nullifier.toBigInt()).toBe(modulus - 1n);
  });
});
// #endregion

// #region Reject proof-mode ambiguity before unknown-field stripping
describe("proof-mode consistency before stripping unknown fields", () => {
  it.each([
    ["session-only response in a bound request", [makeSessionItem()]],
    [
      "both nullifier fields",
      [{ ...makeItem(), session_nullifier: ["0x02", "0x03"] }],
    ],
    ["null opposite field", [{ ...makeItem(), session_nullifier: null }]],
    ["mixed response list", [makeItem(), makeSessionItem()]],
  ])("rejects %s", async (_name, responses) => {
    await expect(
      schema.validate({ ...makeRequest(), responses }, { stripUnknown: true }),
    ).rejects.toThrow(
      "session_nullifier must not be present for uniqueness proofs",
    );
  });

  it("rejects uniqueness fields inside a session-only request", async () => {
    const { action, ...session } = makeRequest();
    await expect(
      schema.validate(
        {
          ...session,
          responses: [{ ...makeSessionItem(), nullifier: "0x02" }],
        },
        { stripUnknown: true },
      ),
    ).rejects.toThrow("nullifier must not be present for session proofs");
  });

  it("still requires a uniqueness nullifier when no opposite field is supplied", async () => {
    const { nullifier, ...item } = makeItem();
    await expect(
      schema.validate({ ...makeRequest(), responses: [item] }),
    ).rejects.toThrow("nullifier is required for v4 uniqueness proofs");
  });
});
// #endregion
