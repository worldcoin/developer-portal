import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { integrationDBSetup, integrationDBTearDown } from "./setup";

beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("/api/v1/graphql", () => {
  test("graphQL request is properly routed", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});

