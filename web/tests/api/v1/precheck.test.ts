import { POST } from "@/api/v1/precheck/[app_id]/index";
import { Nullifier } from "@/graphql/graphql";
import { NextRequest } from "next/server";

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
      post_action_deep_link_android: null as string | null | undefined,
      post_action_deep_link_ios: null as string | null | undefined,
    },
  ],
};

const exampleValidRequestPayload = {
  action: "swag_pack_2022",
  external_nullifier:
    "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
};

const mockParameterStoreAppIds = (appIds: string[]) => {
  global.ParameterStore = {
    getParameter: jest.fn().mockResolvedValue(appIds),
  } as unknown as NonNullable<typeof global.ParameterStore>;
};

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));
const AppPrecheckQuery = jest.fn();
jest.mock("@/api/v1/precheck/[app_id]/graphql/app-precheck.generated", () => ({
  getSdk: () => ({
    AppPrecheckQuery,
  }),
}));
const FetchRpRegistrationForPrecheck = jest.fn();
jest.mock(
  "@/api/v1/precheck/[app_id]/graphql/fetch-rp-registration-for-precheck.generated",
  () => ({
    getSdk: () => ({
      FetchRpRegistrationForPrecheck,
    }),
  }),
);

beforeEach(() => {
  jest.clearAllMocks();
  global.ParameterStore = undefined;
});

describe("/api/v1/precheck/[app_id]", () => {
  test("can fetch precheck response verified", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      name: "The Yellow App Verified",
      is_verified: true,
      is_staging: true,
      engine: "cloud",
      verified_app_logo:
        "https://cdn.test.com/app_staging_6d1c9fb86751a40d952749022db1c1/logo_img.png",
      enable_face_check: true,
      experimental_face_auth_config: "disabled",
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
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload, verified_app_metadata: [] }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      name: "The Yellow App",
      is_verified: false,
      is_staging: true,
      engine: "cloud",
      verified_app_logo: "",
      enable_face_check: true,
      experimental_face_auth_config: "disabled",
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

  test("returns enabled face auth config for allowlisted apps", async () => {
    mockParameterStoreAppIds([appPayload.id]);

    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      experimental_face_auth_config: "enabled",
    });
    expect(global.ParameterStore?.getParameter).toHaveBeenCalledWith(
      "precheck/experimental-face-auth-config/enabled",
      [],
    );
  });

  test("returns disabled face auth config for apps outside the allowlist", async () => {
    mockParameterStoreAppIds(["app_staging_00000000000000000000000000000000"]);

    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      experimental_face_auth_config: "disabled",
    });
  });

  test("returns disabled face auth config when SSM fails", async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockRejectedValue(new Error("SSM error")),
    } as unknown as NonNullable<typeof global.ParameterStore>;

    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      experimental_face_auth_config: "disabled",
    });
  });

  test("returns face auth config for synthetic RP registration actions", async () => {
    mockParameterStoreAppIds([appPayload.id]);

    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [{ ...appPayload, actions: [] }],
    });
    FetchRpRegistrationForPrecheck.mockResolvedValue({
      rp_registration: [{ status: "registered" }],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      experimental_face_auth_config: "enabled",
      action: {
        action: "swag_pack_2022",
        status: "active",
      },
      can_user_verify: "yes",
    });
  });

  test("can fetch precheck response with nullifier", async () => {
    // This is used to check if a specific person has already verified for an action
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify({
          ...exampleValidRequestPayload,
          nullifier_hash: "0x123",
        }),
      },
    );

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
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
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify({
          ...exampleValidRequestPayload,
          nullifier_hash: undefined,
        }),
      },
    );

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [];

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
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
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify({
          ...exampleValidRequestPayload,
          external_nullifier: null,
        }),
      },
    );

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
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

  test("precheck with nullifier and below max number of verifications", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify({
          ...exampleValidRequestPayload,
          nullifier_hash: "0x123",
        }),
      },
    );

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 1 },
    ];
    mockedResponse.actions[0].max_verifications = 2;

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
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
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify({
          ...exampleValidRequestPayload,
          nullifier_hash: "0x123",
        }),
      },
    );

    const mockedResponse = { ...appPayload };
    mockedResponse.actions[0].nullifiers = [
      { nullifier_hash: "0x123", uses: 2 },
    ];
    mockedResponse.actions[0].max_verifications = 2;

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      engine: "cloud",
      sign_in_with_world_id: false,
      can_user_verify: "no", // Maximum number of verifications reached
      action: {
        max_verifications: 2,
      },
    });
  });

  test("precheck response includes return_to fields when action has them", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    const mockedResponse = {
      ...appPayload,
      actions: [
        {
          ...appPayload.actions[0],
          max_verifications: 1,
          post_action_deep_link_android: "https://example.com/return/android",
          post_action_deep_link_ios: "https://example.com/return/ios",
        },
      ],
    };

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      action: {
        action: "swag_pack_2022",
        name: "Swag Pack 2022",
        description: "Receive our Swag Pack 2022",
        max_verifications: 1,
        max_accounts_per_user: 1,
        post_action_deep_link_android: "https://example.com/return/android",
        post_action_deep_link_ios: "https://example.com/return/ios",
      },
    });
  });

  test("precheck response handles null return_to fields", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    const mockedResponse = {
      ...appPayload,
      actions: [
        {
          ...appPayload.actions[0],
          max_verifications: 1,
          post_action_deep_link_android: null,
          post_action_deep_link_ios: null,
        },
      ],
    };

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      action: {
        action: "swag_pack_2022",
        name: "Swag Pack 2022",
        description: "Receive our Swag Pack 2022",
        max_verifications: 1,
        max_accounts_per_user: 1,
        post_action_deep_link_android: null,
        post_action_deep_link_ios: null,
      },
    });
  });

  test("precheck response handles undefined return_to fields", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_staging_6d1c9fb86751a40d952749022db1c1",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    const mockedResponse = {
      ...appPayload,
      actions: [
        {
          ...appPayload.actions[0],
          max_verifications: 1,
          post_action_deep_link_android: undefined,
          post_action_deep_link_ios: undefined,
        },
      ],
    };

    AppPrecheckQuery.mockResolvedValue({
      app: [mockedResponse],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    // When undefined, fields may be omitted or null depending on GraphQL serialization
    const action = responseBody.action || {};
    expect(
      action.post_action_deep_link_android === undefined ||
        action.post_action_deep_link_android === null,
    ).toBe(true);
    expect(
      action.post_action_deep_link_ios === undefined ||
        action.post_action_deep_link_ios === null,
    ).toBe(true);
  });
});

describe("/api/v1/precheck/[action_id] [error cases]", () => {
  test("non-existent action", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/precheck/app_id_do_not_exist",
      {
        method: "POST",
        body: JSON.stringify(exampleValidRequestPayload),
      },
    );

    AppPrecheckQuery.mockResolvedValue({
      app: [],
    });

    const response = await POST(request, {
      params: Promise.resolve({
        app_id: "app_staging_6d1c9fb86751a40d952749022db1c1",
      }),
    });

    expect(response.status).toBe(404);
    const responseBody = await response.json();
    expect(responseBody).toEqual(
      expect.objectContaining({ code: "not_found" }),
    );
  });
});
