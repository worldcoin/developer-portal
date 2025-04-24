import { OIDCErrorCodes } from "@/legacy/backend/oidc";
import handleOIDCValidate from "@/pages/api/v1/oidc/validate";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";

const requestReturnFn = jest.fn();

jest.mock(
  "legacy/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  })),
);

beforeEach(() => {
  requestReturnFn.mockResolvedValue({
    data: {
      app: [
        {
          id: "app_0123456789",
          is_staging: true,
          actions: [
            {
              external_nullifier: "external_nullifier",
              redirects: [
                {
                  redirect_uri: "https://example.com",
                },
              ],
            },
          ],
        },
      ],
      cache: [
        {
          key: "staging.semaphore.wld.eth",
          value: "0x000000000000000000000",
        },
      ],
    },
  });
});

describe("/api/v1/oidc/validate", () => {
  test("can validate app and redirect_uri", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        app_id: "app_0123456789",
        redirect_uri: "https://example.com",
      },
    });

    await handleOIDCValidate(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      app_id: "app_0123456789",
      redirect_uri: "https://example.com",
    });
  });

  test("invalid app_id", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        app_id: "app_invalid",
        redirect_uri: "https://example.com",
      },
    });

    requestReturnFn.mockResolvedValueOnce({
      data: {
        app: [],
        cache: [
          {
            key: "staging.semaphore.wld.eth",
            value: "0x000000000000000000000",
          },
        ],
      },
    });

    await handleOIDCValidate(req, res);

    expect(res._getStatusCode()).toBe(404);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      attribute: "app_id",
      code: "app_not_found",
    });
  });

  test("invalid redirect_uri", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        app_id: "app_0123456789",
        redirect_uri: "https://invalid.com",
      },
    });

    await handleOIDCValidate(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      code: OIDCErrorCodes.InvalidRedirectURI,
      attribute: "redirect_uri",
    });
  });
});
