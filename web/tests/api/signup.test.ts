import fetchMock from "jest-fetch-mock";
import { createMocks } from "node-mocks-http";
import { generateSignUpJWT } from "src/backend/jwts";
import handleSignUp from "src/pages/api/signup";

beforeAll(() => {
  fetchMock.enableMocks();
});

const validPayload = async () => ({
  signup_token: await generateSignUpJWT(
    "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690"
  ),
  team_name: "TestCo",
  ironclad_id: "b41eeaf8-c3b3-482f-a213-2c5de81169ea",
});

const requestReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

describe("/api/v1/signup", () => {
  test("user can sign up", async () => {
    // TODO
  });
});

describe("/api/v1/signup [error cases]", () => {
  test("returns error if attributes are missing", async () => {
    for (const attr of ["team_name", "ironclad_id", "team_name"]) {
      const { req, res } = createMocks({
        method: "POST",
        body: { ...(await validPayload()), [attr]: undefined },
      });
      await handleSignUp(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          detail: "This attribute is required.",
          attribute: attr,
        })
      );
    }
  });

  test("returns error on invalid sign up token", async () => {});

  test("returns error on expired sign up", async () => {});
});
