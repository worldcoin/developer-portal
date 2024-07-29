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

  test("can verify staging proof", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // Simulate environment to treat request as staging
    process.env.NODE_ENV = 'staging';

    // mocks Alchemy response for staging
    fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        success: true,
        nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
        action: "verify",
      }),
    );
  });
  test("action inactive or not found", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload, action: "invalid_action" },
      query: { app_id: "app_staging_112233445566778" },
    });

    // Simulate action not found
    const notFoundResponse = sampleENSActionQueryResponse();
    notFoundResponse.data.app[0].actions = []; // No actions found
    requestReturnFn.mockResolvedValue(notFoundResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "action_not_found",
        detail: "The requested action was not found.",
      }),
    );
  });

  test("on-chain actions cannot be verified", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // Simulate action runs on-chain
    const onChainResponse = sampleENSActionQueryResponse();
    onChainResponse.data.app[0].engine = 'on-chain'; // Action runs on-chain
    requestReturnFn.mockResolvedValue(onChainResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(409);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "on_chain_action",
        detail: "On-chain actions cannot be verified through this endpoint.",
      }),
    );
  });


  test("cannot verify without required parameters", async () => {
    const invalidPayload = { ...validPayload, nullifier_hash: undefined }; // Missing required parameter
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: invalidPayload,
      query: { app_id: "app_staging_112233445566778" },
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "missing_required_parameters",
        detail: "Nullifier hash is required.",
      }),
    );
  });

  test("parameter parsing error", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: "{ invalidJson }",
      query: { app_id: "app_staging_112233445566778" },
    });

    await handleVerify(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "parameter_parsing_error",
        detail: "There was an error parsing one or more parameters.",
      }),
    );
  });

  test("throws error if proof is valid but nullifier cannot be inserted", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    // Simulate nullifier can't be inserted
    when(requestReturnFn)
      .calledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            action_id: expect.stringMatching(/^action_[A-Za-z0-9_]+$/),
            nullifier_hash: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/),
          }),
        }),
      )
      .mockResolvedValue({ data: { insert_nullifier_one: null } }); // No nullifier inserted

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "nullifier_insertion_failed",
        detail:
          "Proof is valid but the nullifier couldn't be inserted. Please try again later.",
      }),
    );
  });

});
