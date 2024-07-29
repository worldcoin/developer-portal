import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { integrationDBClean } from "./setup";

beforeAll(integrationDBClean); // Ensure DB is cleaned before all tests

describe("/api/v1/graphql", () => {
  // Test implementations...
});
