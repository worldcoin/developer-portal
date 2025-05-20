import { integrationDBClean } from "./setup";
import { getAPIServiceClient } from "./test-utils";

beforeEach(integrationDBClean);
describe("/api/v1/graphql", () => {
  test("graphQL request is properly routed", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});
