import { POST } from "@/api/hasura/invite-team-members";
import { Role_Enum } from "@/graphql/graphql";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { gql } from "@apollo/client";
import { NextRequest } from "next/server";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIClient, getAPIUserClient } from "./test-utils";

beforeAll(integrationDBClean); // Ensure DB is cleaned before all tests

describe("team model", () => {
  // Test implementations...
});
