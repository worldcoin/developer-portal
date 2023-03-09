import { gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";
import { integrationDBSetup, integrationDBTearDown } from "./setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("/api/v1/graphql", () => {
  test("graphQL request is properly routed", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});
