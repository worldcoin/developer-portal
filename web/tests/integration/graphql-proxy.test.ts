import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { integrationDBClean } from "./setup";

beforeEach(integrationDBClean);
describe("/api/v1/graphql", () => {
  test("graphQL request is properly routed", async () => {
    // TODO
    const client = await getAPIServiceClient();
  });
});
