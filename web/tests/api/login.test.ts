import { createMocks } from "node-mocks-http";
import * as jose from "jose";
import handleLogin from "../../pages/api/v1/login";

const requestReturnFn = jest.fn();

jest.mock(
  "api-graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

const validPayload = {
  email: "test@worldcoin.org",
  password: "12345678",
};

describe("/api/v1/login", () => {
  test("user can login", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        user: [
          {
            id: "432c849b-6fed-49fa-b127-3bdd7739867e",
            email: "test@worldcoin.org",
            password:
              "salt@a116bdd8db09d840b8d844bda8ec8e53b99f6feb706d597d0952397ceb00c7d85939692e11e3adfb5491ec40e5e5c76be92768c0603941b20001b0e6c0ba4c0253bba17e7bfe6dbdb5e25b5f3f1404a73aaaccca104447bde9438235071a368ef2aacb9aa01d87d23d99b7b1cfd631ea731c0a1222a8b3ff33fd69ae9be0785e2e923742b0d4ff1fb356595f4da856e23a5e4e8af4b29842c2f487f828ebf8c8136e00d3a2f4ecfb9bf1a16553193b63519bfb32daeedc22e0ca9220da4a1598ece605a9afbe9e2ce40c5d2064b2dc5364c2800b078aba325d4da58286619d14a667acae61530a7bc9e6bf20dd18fb36fe2190de19fee291e24677aae58b2e12",
            name: "Alice",
            team_id: "4969ce57-7a35-4fb5-b723-2dba3414ae9e",
          },
        ],
      },
    });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(200);
    const token = res._getJSONData().token;
    expect(token).toBeTruthy();

    const { payload } = await jose.jwtVerify(
      token,
      Buffer.from(JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET || "").key),
      {
        issuer: "https://developer.worldcoin.org",
      }
    );
    const decodedToken = payload as Record<string, any>;
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-default-role"]
    ).toEqual("user");
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"]
    ).toEqual("432c849b-6fed-49fa-b127-3bdd7739867e");
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-team-id"]
    ).toEqual("4969ce57-7a35-4fb5-b723-2dba3414ae9e");
  });
});

describe("/api/v1/login [error cases]", () => {
  test("user cannot login with inexistent email", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        user: [],
      },
    });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        detail: "Invalid email or password.",
        code: "invalid_credentials",
        attribute: null,
      })
    );
  });

  test("user cannot login with incorrect password", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload, password: "invalid" },
    });

    requestReturnFn.mockResolvedValue({
      data: {
        user: [
          {
            id: "432c849b-6fed-49fa-b127-3bdd7739867e",
            email: "test@worldcoin.org",
            password:
              "salt@a116bdd8db09d840b8d844bda8ec8e53b99f6feb706d597d0952397ceb00c7d85939692e11e3adfb5491ec40e5e5c76be92768c0603941b20001b0e6c0ba4c0253bba17e7bfe6dbdb5e25b5f3f1404a73aaaccca104447bde9438235071a368ef2aacb9aa01d87d23d99b7b1cfd631ea731c0a1222a8b3ff33fd69ae9be0785e2e923742b0d4ff1fb356595f4da856e23a5e4e8af4b29842c2f487f828ebf8c8136e00d3a2f4ecfb9bf1a16553193b63519bfb32daeedc22e0ca9220da4a1598ece605a9afbe9e2ce40c5d2064b2dc5364c2800b078aba325d4da58286619d14a667acae61530a7bc9e6bf20dd18fb36fe2190de19fee291e24677aae58b2e12",
            name: "Alice",
            team_id: "4969ce57-7a35-4fb5-b723-2dba3414ae9e",
          },
        ],
      },
    });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        detail: "Invalid email or password.",
        code: "invalid_credentials",
        attribute: null,
      })
    );
  });
});
