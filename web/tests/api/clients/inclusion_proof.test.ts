import { createMocks } from "node-mocks-http";
import fetchMock from "jest-fetch-mock";
import handleInclusionProof from "src/pages/api/v1/clients/inclusion_proof";
import { validSequencerInclusionProof } from "../__mocks__/sequencer.mock";

const requestReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

requestReturnFn.mockResolvedValue({
  data: {
    revocation: [],
  },
});

beforeAll(() => {
  fetchMock.enableMocks();
});

describe("/api/v1/clients/inclusion_proof", () => {
  test("can fetch inclusion proof", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        credential_type: "phone",
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce(JSON.stringify(validSequencerInclusionProof));

    await handleInclusionProof(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      inclusion_proof: validSequencerInclusionProof,
    });
  });

  test("unverified identity", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        credential_type: "phone",
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("provided identity commitment not found", {
      status: 400,
    });

    await handleInclusionProof(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      code: "unverified_identity",
      detail: "This identity is not verified for the relevant credential.",
    });
  });

  test("pending inclusion", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        credential_type: "phone",
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("", {
      status: 202,
    });

    await handleInclusionProof(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      code: "inclusion_pending",
      detail:
        "This identity is in progress of being included on-chain. Please wait a few minutes and try again.",
    });
  });
});
