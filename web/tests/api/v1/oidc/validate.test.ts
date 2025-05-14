import { OIDCErrorCodes } from "@/api/helpers/oidc";
import { POST } from "@/api/v1/oidc/validate";
import { NextRequest } from "next/server";

const requestReturnFn = jest.fn();

jest.mock(
  "@/api/helpers/graphql",
  jest.fn(() => ({
    getAPIServiceGraphqlClient: () => ({
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
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/validate", {
      method: "POST",
      body: JSON.stringify({
        app_id: "app_0123456789",
        redirect_uri: "https://example.com",
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      app_id: "app_0123456789",
      redirect_uri: "https://example.com",
    });
  });

  test("invalid app_id", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/validate", {
      method: "POST",
      body: JSON.stringify({
        app_id: "app_invalid",
        redirect_uri: "https://example.com",
      }),
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

    const response = await POST(req);

    expect(response.status).toBe(404);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      attribute: "app_id",
      code: "app_not_found",
    });
  });

  test("invalid redirect_uri", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/validate", {
      method: "POST",
      body: JSON.stringify({
        app_id: "app_0123456789",
        redirect_uri: "https://invalid.com",
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      code: OIDCErrorCodes.InvalidRedirectURI,
      attribute: "redirect_uri",
    });
  });
});
