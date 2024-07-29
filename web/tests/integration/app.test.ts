import { gql } from "@apollo/client";

import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

import { POST } from "@/api/hasura/reset-client-secret";
import { NextRequest } from "next/server";
import { getAPIClient, getAPIUserClient } from "./test-utils";

beforeAll(integrationDBClean); // Ensure DB is cleaned before all tests

describe("user role", () => {
  // Test implementations...
});
