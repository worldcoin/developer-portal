import { createMocks } from "node-mocks-http";
import handleOIDCAuthorize from "src/pages/api/v1/oidc/authorize";
import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "../setup";
import { testGetDefaultApp } from "../test-utils";
import fetchMock from "jest-fetch-mock";
import { validSemaphoreProofMock } from "tests/api/__mocks__/sequencer.mock";
import { semaphoreProofParamsMock } from "tests/api/__mocks__/proof.mock";
import { OIDCErrorCodes } from "src/backend/oidc";
import { createHash } from "crypto";

beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

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
  } as Record<string, string>);

// TODO: Add additional test cases
describe("/api/v1/oidc/authorize", () => {
  test("can get an auth code", async () => {
    const dbQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Sign In App' limit 1;"
    );
    const app_id = dbQuery.rows[0].id;

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: validParams(app_id),
    });

    // mocks sequencer response for proof verification
    fetchMock
      .mockIf(/crypto.worldcoin.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });
  });

  test("`redirect_uri` is required", async () => {
    const app_id = await testGetDefaultApp();

    const params = validParams(app_id);
    delete params.redirect_uri;

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: params,
    });

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      attribute: "redirect_uri",
      code: "invalid",
      detail: "This attribute is required.",
    });
  });

  test("invalid `redirect_uri` is rejected", async () => {
    const app_id = await testGetDefaultApp();

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        ...validParams(app_id),
        redirect_uri: "https://example.com/invalid",
      },
    });

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      attribute: "redirect_uri",
      code: OIDCErrorCodes.InvalidRedirectURI,
      detail: "Invalid redirect URI.",
    });
  });

  test("can get an auth code with PKCE", async () => {
    const dbQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Sign In App' limit 1;"
    );
    const app_id = dbQuery.rows[0].id;

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: validParams(app_id, true),
    });

    // mocks sequencer response for proof verification
    fetchMock
      .mockIf(/crypto.worldcoin.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });

    const code = res._getJSONData().code;

    const { rows } = await integrationDBExecuteQuery(
      `SELECT * FROM public.auth_code WHERE auth_code = '${code}' LIMIT 1;`
    );
    const { code_challenge, code_challenge_method } = rows[0];

    expect(code_challenge_method).toEqual("S256");
    expect(code_challenge).toEqual(pkceChallenge("my_code_challenge"));
  });
});
