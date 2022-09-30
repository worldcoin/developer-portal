import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { integrationDBSetup, integrationDBTearDown } from "./setup";

// FIXME: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("service role", () => {
  test("verified logo is properly sent when team is verified", async () => {
    // FIXME
    const client = await getAPIServiceClient();
  });

  test("logo is ignored if team is not verified", async () => {
    // FIXME
    const client = await getAPIServiceClient();
  });

  test("role cannot read private description", async () => {
    // FIXME
    const client = await getAPIServiceClient();
  });
});
