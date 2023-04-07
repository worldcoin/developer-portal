import { createMocks } from "node-mocks-http";
import handleOIDCAuthorize from "src/pages/api/v1/oidc/authorize";
import { integrationDBSetup, integrationDBTearDown } from "../setup";
import { testGetDefaultApp } from "../test-utils";
import fetchMock from "jest-fetch-mock";

beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

beforeAll(() => {
  fetchMock.enableMocks();
});

const validParams = (app_id: string) =>
  ({
    // proof verification is mocked
    proof:
      "0x13046d1af7e62f5b48f0abbd7bf90a0dbbed2eedcde362de280f0582069364ff180406ee4160f3649944d083c809a91f0e352dfcb6d4afba8bb35140c9dfc2171c3e646044e3af21aaf9d5c1674e941b1061e5512b1072f9ab7d880851df425c1c8f7a1d556092d201a7678244fddaef11287edd7aa5ea27e126e457227977b02156fdfc9d31e5b308b9728a9753333bc2c7e560087584fb5efbfae18e901818262f99affb31662d5bc0fdfdd1189bd54c662da2653538d4973c3f042e002ab20ad3756c84904a910c8663e775433923c18ef010843859b71e82af7e1856f14716acf42e25976ba0a7cb86ee58ee2ff8471a6563f540831bbb22d0a373087d1f",
    nullifier_hash:
      "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
    merkle_root:
      "0x0936d98c83151035b528d1631df5c3607a740bd296b4c79c627130a96645dcc7",
    credential_type: "orb",
    app_id: app_id,
    nonce: "0x0936d98c83151035b528d1631df5c3607a740bd296b4c79c627130a96645dcc7", // because IDKit is currently mocked, we need to pass an already encoded value
    scope: "openid email",
    response_type: "code",
    redirect_uri: "http://localhost:3000/login",
    state: "my_state",
  } as Record<string, string>);

// TODO: A lot more tests are missing
describe("/api/v1/oidc/authorize", () => {
  test("can get an auth code", async () => {
    const app_id = await testGetDefaultApp();

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: validParams(app_id),
    });

    // mocks Alchemy response for proof verification
    fetchMock
      .mockIf(/alchemy.com/)
      .mockResponse(JSON.stringify({ result: "0x" }));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });
  });

  test("`redirect_uri` is required for auth code flow", async () => {
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
      code: "required",
      detail: "This attribute is required for the authorization code flow.",
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
      code: "invalid",
      detail: "Invalid redirect URI. Redirect URIs should be preregistered.",
    });
  });
});
