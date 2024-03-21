import fetchMock from "jest-fetch-mock";
import { when } from "jest-when";
import { createMocks } from "node-mocks-http";
import { NullifierModel } from "@/legacy/lib/models";
import handleVerify from "@/pages/api/v1/verify/[app_id]";
import { semaphoreProofParamsMock } from "./__mocks__/proof.mock";
import { NextApiRequest, NextApiResponse } from "next";

const validPayload = {
  ...semaphoreProofParamsMock,
  action: "verify",
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
      nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
      created_at: "2021-08-12T20:00:00.000Z",
    },
  },
});

const requestReturnFn = jest.fn();

jest.mock(
  "legacy/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: requestReturnFn,
    }),
  })),
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
      }),
    )
    .mockResolvedValue(nullifierInsertResponse())
    .calledWith(expect.anything())
    .mockResolvedValue(sampleENSActionQueryResponse());
});

// TODO: Finish these test cases
describe("/api/v1/verify", () => {
  test("can verify proof", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // mocks Alchemy response
    fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));

    await handleVerify(req, res);

    console.error(res._getJSONData());

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
        action: "verify",
      }),
    );
  });

  test("can verify staging proof", async () => {});
  test("can verify with empty action", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
        }),
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
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
        action: "",
      }),
    );
  });

  test("can verify without a signal", async () => {
    // signal defaults to empty string if not provided

    const noSignalPayload: Record<string, any> = { ...validPayload };
    delete noSignalPayload.signal;

    const payloads = [
      noSignalPayload,
      { ...validPayload, signal: undefined },
      { ...validPayload, signal: "" },
    ];

    for (const payload of payloads) {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: payload,
        query: { app_id: "app_staging_112233445566778" },
      });

      // mocks sequencer response
      fetchMock.mockResponseOnce(JSON.stringify({ status: "mined" }));

      await handleVerify(req, res);

      console.error(res._getJSONData());

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: true,
          nullifier_hash:
            "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
          action: "verify",
        }),
      );
    }
  });
});

describe("/api/verify [error cases]", () => {
  test("action inactive or not found", async () => {});
  test("on-chain actions cannot be verified", async () => {});
  test("prevent duplicates (uniqueness check)", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
        code: "max_verifications_reached",
        detail: "This person has already verified for this action.",
      }),
    );
  });

  test("cannot verify if reached max number of verifications", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
        code: "max_verifications_reached",
        detail:
          "This person has already verified for this action the maximum number of times (2).",
      }),
    );
  });
  test("cannot verify without required parameters", async () => {});
  test("parameter parsing error", async () => {});
  test("throws error if proof is valid but nullifier cannot be inserted", async () => {});
  test("invalid merkle root", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
      }),
    );
  });
  test("invalid proof", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("invalid semaphore proof", {
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
      }),
    );
  });
});
