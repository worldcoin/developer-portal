import { createMocks } from "node-mocks-http";
import handleVerifyPrecheck from "../../pages/api/v1/precheck/[action_id]";

const requestReturnFn = jest.fn();

const actionPayload = {
  id: "action_test_123",
  public_description: "Receive our Swag Pack 2022",
  name: "Swag Pack 2022",
  is_staging: true,
  engine: "cloud",
  return_url: "",
  max_verifications_per_person: 1,
  app: {
    name: "The Yellow App",
    is_verified: true,
    verified_app_logo:
      "https://gravatar.com/avatar/67ceb6c33dbb7ca77b8cde2fb2fdc04b",
    __typename: "app",
  },
  nullifiers: [],
  __typename: "action",
};

jest.mock(
  "api-graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

describe("/api/v1/precheck/[action_id]", () => {
  test("can fetch precheck response", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: { action_id: "action_test_123" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        action: [{ ...actionPayload }],
      },
    });

    await handleVerifyPrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      ...actionPayload,
      can_verify: null, // Because no `nullifier_hash` was provided
    });
  });

  test("can fetch precheck response with nullifier", async () => {
    // This is used to check if a specific person has already verified for an action
    const { req, res } = createMocks({
      method: "GET",
      query: { action_id: "action_test_123", nullifier_hash: "123" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        action: [{ ...actionPayload, nullifiers: [{ nullifier_hash: "123" }] }],
      },
    });

    await handleVerifyPrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      ...actionPayload,
      can_verify: false, // Person has already verified for this action
      nullifiers: [{ nullifier_hash: "123" }],
    });
  });

  test("precheck with nullifier and below max number of verifications", async () => {
    // This is used to check if a specific person has already verified for an action
    const { req, res } = createMocks({
      method: "GET",
      query: { action_id: "action_test_123", nullifier_hash: "123" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        action: [
          {
            ...actionPayload,
            max_verifications_per_person: 2,
            nullifiers: [{ nullifier_hash: "123" }],
          },
        ],
      },
    });

    await handleVerifyPrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      ...actionPayload,
      max_verifications_per_person: 2,
      can_verify: true, // Person has already verified for this action, but this action supports multiple verifications
      nullifiers: [{ nullifier_hash: "123" }],
    });
  });

  test("precheck with nullifier and max number of verifications met", async () => {
    // This is used to check if a specific person has already verified for an action
    const { req, res } = createMocks({
      method: "GET",
      query: { action_id: "action_test_123", nullifier_hash: "123" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        action: [
          {
            ...actionPayload,
            max_verifications_per_person: 2,
            nullifiers: [{ nullifier_hash: "123" }, { nullifier_hash: "123" }],
          },
        ],
      },
    });

    await handleVerifyPrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      ...actionPayload,
      max_verifications_per_person: 2,
      can_verify: false, // Person has already met the max number of verifications
      nullifiers: [{ nullifier_hash: "123" }, { nullifier_hash: "123" }],
    });
  });
});

describe("/api/v1/precheck/[action_id] [error cases]", () => {
  test("non-existent action", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: { action_id: "wld_i_do_not_exist" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        action: [],
      },
    });

    await handleVerifyPrecheck(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({ code: "not_found" })
    );
  });
});
