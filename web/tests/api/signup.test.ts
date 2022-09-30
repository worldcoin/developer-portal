import { createMocks } from "node-mocks-http";
import handleSignup from "../../pages/api/v1/signup";
import { when } from "jest-when";
import * as jose from "jose";

const validPayload = {
  email: "test@worldcoin.org",
  name: "Alice",
  team_name: "The Purple Collective",
  password: "12345678",
  ironclad_id: "4d57f6a8-d97a-4fce-86c7-ece3fc42d941",
};

const requestReturnFn = jest.fn();

jest.mock(
  "api-graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

describe("/api/v1/signup", () => {
  test("user can sign up", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
    });

    when(requestReturnFn)
      .calledWith(
        expect.objectContaining({
          variables: { email: validPayload.email },
        })
      )
      .mockResolvedValue({ data: { user: [] } })
      .calledWith(expect.anything())
      .mockResolvedValue({
        data: {
          insert_user_one: {
            team_id: "0020629d-4b58-4b2d-9f47-e57777c9ccf9",
            id: "310868aa-1162-4e9d-b57d-09063195887d",
          },
        },
      });

    await handleSignup(req, res);

    expect(res._getStatusCode()).toBe(201);
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
    ).toEqual("310868aa-1162-4e9d-b57d-09063195887d");
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-team-id"]
    ).toEqual("0020629d-4b58-4b2d-9f47-e57777c9ccf9");
  });
});

describe("/api/v1/signup [error cases]", () => {
  test("returns error if attributes are missing", async () => {
    for (const attr of ["email", "name", "team_name", "password"]) {
      const { req, res } = createMocks({
        method: "POST",
        body: { ...validPayload, [attr]: undefined },
      });
      await handleSignup(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          detail: "This attribute is required.",
          attribute: attr,
        })
      );
    }
  });

  test("returns error if email is duplicated", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
    });
    requestReturnFn.mockResolvedValue({
      data: {
        user: [{ email: "test@worldcoin.org" }],
      },
    });
    await handleSignup(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "already_registered",
        attribute: "email",
      })
    );
  });

  test("returns error on invalid email", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload, email: "invalid" },
    });

    await handleSignup(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "invalid",
        attribute: "email",
      })
    );
  });

  test("password must be 8 chars", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload, password: "123" },
    });

    await handleSignup(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "min_length",
        attribute: "password",
      })
    );
  });
});
