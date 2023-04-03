import { retrieveJWK } from "src/backend/jwks";
import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "./setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("jwks management", () => {
  it("can retrieve existing jwks", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."jwks" WHERE "alg" = "RS256" LIMIT 1;'
    );

    const jwk = await retrieveJWK(rows[0].id);

    expect(jwk.kid).toEqual(rows[0].id);
  });
});
