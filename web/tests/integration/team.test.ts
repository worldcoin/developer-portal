import { getAPIServiceClient } from "src/backend/graphql";
import { integrationDBSetup, integrationDBTearDown } from "./setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("team model", () => {
  test("verified logo is properly sent when team is verified", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});
