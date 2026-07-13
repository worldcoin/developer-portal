jest.mock("server-only", () => ({}));

import { AdminHasuraRole } from "@/lib/admin-auth/types";
import { jwtVerify } from "jose";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    GENERAL_SECRET_KEY: "test-general-secret",
    HASURA_GRAPHQL_JWT_SECRET: JSON.stringify({
      type: "HS256",
      key: "test-hasura-secret",
    }),
    JWT_ISSUER: "test-issuer",
  };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("generateInternalDashboardJWT", () => {
  it("emits a single internal dashboard Hasura role", async () => {
    const { generateInternalDashboardJWT } = await import("@/api/helpers/jwts");
    const token = await generateInternalDashboardJWT({
      email: "reader@example.com",
      subject: "reader-subject",
      role: AdminHasuraRole.Readonly,
    });

    const { payload } = await jwtVerify(
      token,
      new Uint8Array(Buffer.from("test-hasura-secret")),
      { issuer: "test-issuer" },
    );

    expect(payload.sub).toBe("reader-subject");
    expect(payload["https://hasura.io/jwt/claims"]).toEqual({
      "x-hasura-allowed-roles": ["internal_dashboard_readonly"],
      "x-hasura-default-role": "internal_dashboard_readonly",
      "x-hasura-admin-subject": "reader-subject",
    });
  });
});
