import { createMocks } from "node-mocks-http";
import handlePrecheck from "@/pages/api/v1/precheck/[app_id]";
import { Nullifier } from "@/graphql/graphql";
import { NextApiRequest, NextApiResponse } from "next";

const requestReturnFn = jest.fn();

type _Nullifier = Pick<Nullifier, "nullifier_hash" | "uses" | "__typename">;
const appPayload = {
  id: "app_staging_6d1c9fb86751a40d952749022db1c1",
  is_staging: true,
  engine: "cloud",
  app_metadata: [
    {
      name: "The Yellow App",
      logo_img_url: "",
    },
  ],
  verified_app_metadata: [
    {
      name: "The Yellow App Verified",
      logo_img_url: "logo_img.png",
    },
  ],
  actions: [
    {
      name: "Swag Pack 2022",
      action: "swag_pack_2022",
      description: "Receive our Swag Pack 2022",
      external_nullifier:
        "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
      max_verifications: 1,
      max_accounts_per_user: 1,
      nullifiers: [] as [_Nullifier] | [],
    },
  ],
};

const exampleValidRequestPayload = {
  action: "swag_pack_2022",
  external_nullifier:
    "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
};

jest.mock(
  "legacy/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  })),
);

describe("/api/v1/precheck/[app_id]", () => {
  test("can fetch precheck response verified", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: exampleValidRequestPayload,
    });

    requestReturnFn.mockResolvedValue({
      data: {
        app: [{ ...appPayload }],
      },
    });

    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      name: "The Yellow App Verified",
      is_verified: true,
      is_staging: true,
      engine: "cloud",
      verified_app_logo:
        "https://cdn.test.com/app_staging_6d1c9fb86751a40d952749022db1c1/logo_img.png",
      sign_in_with_world_id: false,
      can_user_verify: "undetermined", // Because no `nullifier_hash` was provided
      action: {
        action: "swag_pack_2022",
        name: "Swag Pack 2022",
        description: "Receive our Swag Pack 2022",
        max_verifications: 1,
        max_accounts_per_user: 1,
      },
    });
  });

  test("can fetch precheck response unverified", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: exampleValidRequestPayload,
    });

    requestReturnFn.mockResolvedValue({
      data: {
        app: [{ ...appPayload, verified_app_metadata: [] }],
      },
    });

    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      name: "The Yellow App",
      is_verified: false,
      is_staging: true,
      engine: "cloud",
      verified_app_logo: "",
      sign_in_with_world_id: false,
      can_user_verify: "undetermined", // Because no `nullifier_hash` was provided
      action: {
        action: "swag_pack_2022",
        name: "Swag Pack 2022",
        description: "Receive our Swag Pack 2022",
        max_verifications: 1,
        max_accounts_per_user: 1,
      },
    });
  });

  test("creates action on the fly when it does not exist", async () => {
    // TODO
  });

  test("can fetch precheck response with nullifier", async () => {
    // This is used to check if a specific person has already verified for an action
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: { ...exampleValidRequestPayload, nullifier_hash: "0x123" },
    });

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];

    requestReturnFn.mockResolvedValue({
      data: {
        app: [mockedResponse],
      },
    });
    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      can_user_verify: "no", // Person has already verified for this action
      action: {
        max_verifications: 1,
      },
    });
  });

  test("can fetch precheck response without nullifier", async () => {
    // This is used to check if a specific person has already verified for an action
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: { ...exampleValidRequestPayload, nullifier_hash: undefined },
    });

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [];

    requestReturnFn.mockResolvedValue({
      data: {
        app: [mockedResponse],
      },
    });
    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      can_user_verify: "undetermined",
      action: {
        max_verifications: 1,
      },
    });
  });

  test("can fetch precheck response with external_nullifier=null", async () => {
    // For broader compatibility we accept empty strings as well as `null`. World App on Android in particular requires this.
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: { ...exampleValidRequestPayload, external_nullifier: null },
    });

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];

    requestReturnFn.mockResolvedValue({
      data: {
        app: [mockedResponse],
      },
    });
    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      action: {
        max_verifications: 1,
        external_nullifier:
          "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
      },
    });
  });

  test("requires external_nullifier when action is not provided", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: {
        ...exampleValidRequestPayload,
        external_nullifier: null,
        action: null,
      },
    });

    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      attribute: "external_nullifier",
      detail: "This attribute is required when action is not provided.",
    });
  });

  test("precheck with nullifier and below max number of verifications", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: { ...exampleValidRequestPayload, nullifier_hash: "0x123" },
    });

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];
    mockedResponse.actions[0].max_verifications = 2;

    requestReturnFn.mockResolvedValue({
      data: {
        app: [mockedResponse],
      },
    });
    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      can_user_verify: "yes", // Person has already verified for this action, but this action supports multiple verifications
      action: {
        max_verifications: 2,
      },
    });
  });

  test("precheck with nullifier and max number of verifications met", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_staging_6d1c9fb86751a40d952749022db1c1" },
      body: { ...exampleValidRequestPayload, nullifier_hash: "0x123" },
    });

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 2 },
    ];
    mockedResponse.actions[0].max_verifications = 2;

    requestReturnFn.mockResolvedValue({
      data: {
        app: [mockedResponse],
      },
    });
    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      can_user_verify: "no", // Maximum number of verifications reached
      action: {
        max_verifications: 2,
      },
    });
  });
});

describe("/api/v1/precheck/[action_id] [error cases]", () => {
  test("non-existent action", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id: "app_id_do_not_exist" },
      body: exampleValidRequestPayload,
    });

    requestReturnFn.mockResolvedValue({
      data: {
        app: [],
      },
    });

    await handlePrecheck(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({ code: "not_found" }),
    );
  });
});
