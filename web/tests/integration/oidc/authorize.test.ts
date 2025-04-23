import { OIDCErrorCodes } from "@/api/helpers/oidc";
import { POST } from "@/api/v1/oidc/authorize";
import { createHash } from "crypto";
import fetchMock from "jest-fetch-mock";
import { NextRequest } from "next/server";
import { semaphoreProofParamsMock } from "tests/api/__mocks__/proof.mock";
import { validSemaphoreProofMock } from "tests/api/__mocks__/sequencer.mock";
import { integrationDBClean, integrationDBExecuteQuery } from "../setup";
import { testGetDefaultApp } from "../test-utils";

beforeEach(async () => {
  await integrationDBClean();
  await global.RedisClient?.flushall();
});

beforeAll(() => {
  fetchMock.enableMocks();
});

const pkceChallenge = (code_verifier: string) => {
  return createHash("sha256")
    .update(code_verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const validParams = (app_id: string, pkce = false) =>
  ({
    // proof verification is mocked
    ...semaphoreProofParamsMock,
    app_id: app_id,
    scope: "openid email",
    response_type: "code",
    redirect_uri: "http://localhost:3000/login",
    state: "my_state",
    ...(pkce
      ? {
          code_challenge: pkceChallenge("my_code_challenge"),
          code_challenge_method: "S256",
        }
      : {}),
  }) as Record<string, string>;

// TODO: Add additional test cases
describe("/api/v1/oidc/authorize", () => {
  test("can get an auth code", async () => {
    const dbQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Sign In App' LIMIT 1;",
    );
    const app_id = dbQuery.rows[0].app_id;
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validParams(app_id)),
    });

    // mocks sequencer response for proof verification
    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });
  });

  test("`redirect_uri` is required", async () => {
    const app_id = await testGetDefaultApp();

    const params = validParams(app_id);
    delete params.redirect_uri;

    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      attribute: "redirect_uri",
      code: "invalid",
      detail: "This attribute is required.",
    });
  });

  test("invalid `redirect_uri` is rejected", async () => {
    const app_id = await testGetDefaultApp();

    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...validParams(app_id),
        redirect_uri: "https://example.com/invalid",
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      attribute: "redirect_uri",
      code: OIDCErrorCodes.InvalidRedirectURI,
      detail: "Invalid redirect URI.",
    });
  });

  test("can get an auth code with PKCE", async () => {
    const dbQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Sign In App' LIMIT 1;",
    );
    const app_id = dbQuery.rows[0].app_id;
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validParams(app_id, true)),
    });

    // mocks sequencer response for proof verification
    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });

    const code = data.code;

    const { rows } = await integrationDBExecuteQuery(
      `SELECT * FROM public.auth_code WHERE auth_code = '${code}' LIMIT 1;`,
    );
    const { code_challenge, code_challenge_method } = rows[0];

    expect(code_challenge_method).toEqual("S256");
    expect(code_challenge).toEqual(pkceChallenge("my_code_challenge"));
  });
});
