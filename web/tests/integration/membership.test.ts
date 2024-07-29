import { gql } from "@apollo/client";

import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

import { getAPIUserClient } from "./test-utils";

beforeAll(integrationDBClean); // Ensure DB is cleaned before all tests

describe("user role", () => {
  // Test implementations...
});
