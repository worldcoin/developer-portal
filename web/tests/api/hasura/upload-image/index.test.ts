import { POST } from "@/api/hasura/upload-image";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextRequest } from "next/server";

const requestMock = jest.fn();

jest.mock("../../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock("../../../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
}));

jest.mock("@aws-sdk/s3-presigned-post", () => ({
  createPresignedPost: jest.fn(),
}));

const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const otherTeamId = "team_69ee87c992c40b111e896248fd00cd04";
const appId = "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a";
const userId = "user_7acdfce5eeadc33955460dcbc1c463dd";

const mockGetAPIServiceGraphqlClient =
  getAPIServiceGraphqlClient as jest.MockedFunction<
    typeof getAPIServiceGraphqlClient
  >;
const mockCreatePresignedPost = createPresignedPost as jest.MockedFunction<
  typeof createPresignedPost
>;

const operationName = (query: unknown) => {
  if (typeof query === "string") {
    return query;
  }

  const document = query as {
    definitions?: Array<{ name?: { value?: string } }>;
  };

  return document.definitions?.[0]?.name?.value;
};

const createRequest = ({
  role = "api_key",
  inputTeamId = teamId,
  sessionTeamId = teamId,
}: {
  role?: "api_key" | "user";
  inputTeamId?: string;
  sessionTeamId?: string;
} = {}) =>
  new NextRequest(
    `http://localhost:3000/api/hasura/upload-image?app_id=${appId}&image_type=logo_img&content_type_ending=png`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
      },
      body: JSON.stringify({
        action: { name: "upload_image" },
        input: { team_id: inputTeamId },
        session_variables: {
          "x-hasura-role": role,
          "x-hasura-team-id": sessionTeamId,
          "x-hasura-user-id": userId,
        },
      }),
    },
  );

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  process.env.ASSETS_S3_REGION = "us-east-1";
  process.env.ASSETS_S3_BUCKET_NAME = "assets-bucket";

  mockGetAPIServiceGraphqlClient.mockResolvedValue({
    request: requestMock,
  } as any);
  mockCreatePresignedPost.mockResolvedValue({
    url: "https://assets.example.com",
    fields: { key: "unverified/test/logo_img.png" },
  });
  requestMock.mockImplementation(async (query: unknown) => {
    switch (operationName(query)) {
      case "CheckAppInTeam":
        return {
          app: [
            {
              id: appId,
              app_metadata: [{ id: "meta_123" }],
            },
          ],
        };
      case "CheckUserInApp":
        return { team: [{ id: teamId }] };
      default:
        throw new Error(`Unexpected query: ${operationName(query)}`);
    }
  });
});

describe("/api/hasura/upload-image", () => {
  it("rejects API-key uploads when the input team does not match the session team", async () => {
    const res = (await POST(
      createRequest({ inputTeamId: otherTeamId, sessionTeamId: teamId }),
    ))!;

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "App not found.",
      extensions: { code: "not_found" },
    });
    expect(requestMock).not.toHaveBeenCalled();
    expect(mockCreatePresignedPost).not.toHaveBeenCalled();
  });

  it("rejects uploads when the app has no unverified metadata", async () => {
    requestMock.mockImplementation(async (query: unknown) => {
      if (operationName(query) === "CheckAppInTeam") {
        return { app: [{ id: appId, app_metadata: [] }] };
      }

      throw new Error(`Unexpected query: ${operationName(query)}`);
    });

    const res = (await POST(createRequest()))!;

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "App not found.",
      extensions: { code: "not_found" },
    });
    expect(mockCreatePresignedPost).not.toHaveBeenCalled();
  });

  it("allows uploads only for an app in the session team with unverified metadata", async () => {
    const res = (await POST(createRequest()))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://assets.example.com",
      stringifiedFields: JSON.stringify({
        key: "unverified/test/logo_img.png",
      }),
    });
    expect(mockCreatePresignedPost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        Bucket: "assets-bucket",
        Key: `unverified/${appId}/logo_img.png`,
      }),
    );
  });

  it("rejects dashboard user uploads when the app has no unverified metadata", async () => {
    requestMock.mockImplementation(async (query: unknown) => {
      switch (operationName(query)) {
        case "CheckUserInApp":
          return { team: [{ id: teamId }] };
        case "CheckAppInTeam":
          return { app: [{ id: appId, app_metadata: [] }] };
        default:
          throw new Error(`Unexpected query: ${operationName(query)}`);
      }
    });

    const res = (await POST(createRequest({ role: "user" })))!;

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "App not found.",
      extensions: { code: "not_found" },
    });
    expect(mockCreatePresignedPost).not.toHaveBeenCalled();
  });
});
