import fetchMock from "jest-fetch-mock";
import { when } from "jest-when";
import { createMocks } from "node-mocks-http";
import { NullifierModel } from "src/lib/models";
import handleVerify from "src/pages/api/v1/verify/[app_id]";

const validPayload = {
  merkle_root:
    "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
  nullifier_hash:
    "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
  proof:
    "0x11b4f021bd8c4d11a5ff1edda919ab825aa377c6922f7f3f5471a624e07f38250692d8414be3e25c3070f164de38069a8d069c94db31fd143eb3507d04487d4203565989a58f63d5b45f973beeb6e19d7c8de14e7f024b8881aacb4eddcd4b4716a2bcb5e732c1e362a6a243248c7b35d6aacead7bcd4c96f9aa36217ef1cbf92434db66fd35b0dac7cda875861d474867871aff8f465c0e55605f529e64c72805ce10171cf645d6ffdfa5507f51a87d9edefddca1acc5741e03bae83306ca31239dfffeaa8f91d2b6749899f377eb4f3e5db557ede16faa7e619d248cd388e814b0673c831201be0fffd84781842692ae9c4ef71c0f9dcd16f496c829055246",
  credential_type: "orb",
  action: "verify",
  signal: "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690", // using an ABI-like encoded signal
};

const sampleENSActionQueryResponse = () => ({
  data: {
    cache: [
      {
        key: "semaphore.wld.eth",
        value: "0x1234567890",
      },
      {
        key: "staging.semaphore.wld.eth",
        value: "0x9876543210",
      },
    ],
    app: [
      {
        id: "app_staging_112233445566778",
        is_staging: true,
        engine: "cloud",
        actions: [
          {
            id: "action_staging_112233445566778",
            action: "verify",
            max_verifications: 1,
            external_nullifier:
              "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
            nullifiers: [] as Pick<NullifierModel, "nullifier_hash">[],
          },
        ],
      },
    ],
  },
});

const nullifierInsertResponse = () => ({
  data: {
    insert_nullifier_one: {
      nullifier_hash:
        "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
      created_at: "2021-08-12T20:00:00.000Z",
    },
  },
});

const requestReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: requestReturnFn,
    }),
  }))
);

beforeAll(() => {
  fetchMock.enableMocks();
});

beforeEach(() => {
  // Reset mocks for each test, can be overridden by each test
  when(requestReturnFn)
    .calledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          action_id: expect.stringMatching(/^action_[A-Za-z0-9_]+$/),
          nullifier_hash: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/),
        }),
      })
    )
    .mockResolvedValue(nullifierInsertResponse())
    .calledWith(expect.anything())
    .mockResolvedValue(sampleENSActionQueryResponse());
});

// TODO: Finish these test cases
describe("/api/v1/verify", () => {
  test("can verify proof", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // mocks Alchemy response
    fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        nullifier_hash:
          "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
        action: "verify",
      })
    );
  });

  test("can verify staging proof", async () => {});
  test("can verify with empty action", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload, action: "" },
      query: { app_id: "app_staging_112233445566778" },
    });

    const precheckResponse = sampleENSActionQueryResponse();
    precheckResponse.data.app[0].actions[0].action = "";
    when(requestReturnFn)
      .calledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            action_id: expect.stringMatching(/^action_[A-Za-z0-9_]+$/),
            nullifier_hash: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/),
            merkle_root: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/),
          }),
        })
      )
      .mockResolvedValue(nullifierInsertResponse())
      .calledWith(expect.anything())
      .mockResolvedValue(precheckResponse);

    // mocks Alchemy response
    fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        nullifier_hash:
          "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
        action: "",
      })
    );
  });
});

describe("/api/verify [error cases]", () => {
  test("action inactive or not found", async () => {});
  test("on-chain actions cannot be verified", async () => {});
  test("prevent duplicates (uniqueness check)", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    const precheckResponse = sampleENSActionQueryResponse();
    precheckResponse.data.app[0].actions[0].nullifiers = [
      { nullifier_hash: "nil_123" },
    ];
    requestReturnFn.mockResolvedValue(precheckResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "already_verified",
        detail: "This person has already verified for this action.",
      })
    );
  });

  test("cannot verify if reached max number of verifications", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    const precheckResponse = sampleENSActionQueryResponse();
    precheckResponse.data.app[0].actions[0].nullifiers = [
      { nullifier_hash: "nil_123" },
      { nullifier_hash: "nil_123" },
    ];
    precheckResponse.data.app[0].actions[0].max_verifications = 2;
    requestReturnFn.mockResolvedValue(precheckResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "already_verified",
        detail:
          "This person has already verified for this action the maximum number of times (2).",
      })
    );
  });
  test("cannot verify without required parameters", async () => {});
  test("parameter parsing error", async () => {});
  test("throws error if proof is valid but nullifier cannot be inserted", async () => {});
  test("invalid merkle root", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("invalid root", {
      status: 500,
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "invalid_merkle_root",
        detail:
          "The provided Merkle root is invalid. User appears to be unverified.",
        attribute: null,
      })
    );
  });
  test("invalid proof", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("invalid proof", {
      status: 500,
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "invalid_proof",
        detail:
          "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
        attribute: null,
      })
    );
  });
});
