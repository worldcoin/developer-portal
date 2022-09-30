import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { integrationDBSetup, integrationDBTearDown } from "./setup";

// FIXME: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("/api/v1/graphql", () => {
  test("graphQL request is properly routed", async () => {
    // FIXME
    const client = await getAPIServiceClient();
  });
});
