import fetchMock from "jest-fetch-mock";
import { createMocks } from "node-mocks-http";
import handleInclusionProof from "src/pages/api/v1/clients/inclusion_proof";
import {
  minedSequencerInclusionProof,
  pendingSequencerInclusionProof,
} from "../__mocks__/sequencer.mock";
import { CredentialType } from "@worldcoin/idkit-core";

const apiReturnFn = jest.fn();
const backendReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: apiReturnFn,
    }),
    getWLDAppBackendServiceClient: (is_staging: boolean) => ({
      query: backendReturnFn,
    }),
  }))
);

apiReturnFn.mockResolvedValue({
  data: {
    revocation: [],
  },
});

backendReturnFn.mockResolvedValue({
  data: {
    user: [],
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
        credential_type: CredentialType.Device,
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce(JSON.stringify(minedSequencerInclusionProof));

    await handleInclusionProof(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      inclusion_proof: minedSequencerInclusionProof,
    });
  });

  test("unverified identity", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        credential_type: CredentialType.Device,
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce("provided identity commitment is invalid", {
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
        credential_type: CredentialType.Device,
        identity_commitment: "0x1234567890",
        env: "staging",
      },
    });

    // mocks sequencer response
    fetchMock.mockResponseOnce(JSON.stringify(pendingSequencerInclusionProof), {
      status: 200,
    });

    await handleInclusionProof(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      inclusion_proof: pendingSequencerInclusionProof,
    });
  });
});
