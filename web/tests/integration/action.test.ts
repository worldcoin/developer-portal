import { gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "./setup";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("service role", () => {
  test("can select actions", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."app" WHERE "is_archived" = true LIMIT 1;'
    );

    const client = await getAPIServiceClient();
    const query = gql(`query ListActions {
      action {
        id
        name
        description
      }
    }    
    `);

    const response = await client.query({ query });

    // First app is the automatically created sign in with World ID
    expect(response.data.action[0]).toEqual(
      expect.objectContaining({
        name: "Sign in with World ID", // NOTE: also indirectly tests the default action Sign in with World ID is created
        id: expect.stringContaining("action_"),
      })
    );

    for (const row of rows) {
      // Service role should not see archived actions
      expect(row.app_id).not.toEqual(rows[0].id);
    }
  });

  test("cannot delete actions", async () => {
    const client = await getAPIServiceClient();
    const query = gql(`mutation DeleteActionMutation {
      delete_action(where: {}) {
        affected_rows
      }
    }
    `);

    try {
      await client.query({ query });
      expect(true).toBe(false); // Fail test if above expression doesn't throw
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        "ApolloError: field 'delete_action' not found in type: 'mutation_root'"
      );
    }
  });
});
