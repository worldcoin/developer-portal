import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIClient, getAPIUserClient } from "./test-utils";

/**
 * Integration tests for API key security
 *
 * These tests verify that API keys cannot be reassigned to different teams,
 * which would allow unauthorized access to another team's resources.
 *
 * H1 Report Reference: API keys could be reassigned by including team_id in update mutations
 */

// Clean database before each test
beforeEach(integrationDBClean);

describe("API key security", () => {
  test("should NOT allow reassigning API key to another team", async () => {
    // Get two different teams with their owners
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT DISTINCT t.id as team_id, t.name as team_name, m.user_id 
       FROM "public"."team" t 
       JOIN "public"."membership" m ON t.id = m.team_id 
       WHERE m.role = 'OWNER' 
       LIMIT 2`,
    )) as {
      rows: Array<{
        team_id: string;
        team_name: string;
        user_id: string;
      }>;
    };

    expect(teams.length).toBe(2);

    const attackerTeam = teams[0];
    const victimTeam = teams[1];

    // Create an API key for the attacker's team
    const attackerClient = await getAPIUserClient({
      user_id: attackerTeam.user_id,
    });

    const createKeyMutation = gql`
      mutation InsertKey($name: String!, $teamId: String!) {
        insert_api_key_one(object: { name: $name, team_id: $teamId }) {
          id
          team_id
          created_at
          updated_at
          is_active
          name
        }
      }
    `;

    const createResponse = await attackerClient.mutate({
      mutation: createKeyMutation,
      variables: {
        name: "Attacker's API Key",
        teamId: attackerTeam.team_id,
      },
    });

    const apiKeyId = createResponse.data?.insert_api_key_one?.id;
    expect(apiKeyId).toBeDefined();
    expect(createResponse.data?.insert_api_key_one?.team_id).toBe(
      attackerTeam.team_id,
    );

    // Attempt to reassign the API key to the victim's team
    const updateKeyMutation = gql`
      mutation UpdateKey(
        $id: String!
        $name: String!
        $is_active: Boolean!
        $team_id: String!
      ) {
        update_api_key_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name, is_active: $is_active, team_id: $team_id }
        ) {
          id
          team_id
          created_at
          updated_at
          is_active
          name
        }
      }
    `;

    // Try to exploit the vulnerability
    let updateError;
    try {
      await attackerClient.mutate({
        mutation: updateKeyMutation,
        variables: {
          id: apiKeyId,
          name: "Reassigned Key",
          is_active: true,
          team_id: victimTeam.team_id, // Attempting to reassign to victim's team
        },
      });
    } catch (error: any) {
      updateError = error;
    }

    // After fix: The update should fail with a GraphQL error
    expect(updateError).toBeDefined();
    expect(updateError.graphQLErrors).toBeDefined();
    expect(updateError.graphQLErrors[0]?.message).toContain(
      "field 'team_id' not found in type: 'api_key_set_input'",
    );

    // Verify the API key is still associated with the attacker's team
    const { rows: apiKeys } = (await integrationDBExecuteQuery(
      `SELECT team_id FROM "public"."api_key" WHERE id = '${apiKeyId}'`,
    )) as { rows: Array<{ team_id: string }> };

    expect(apiKeys[0].team_id).toBe(attackerTeam.team_id);
  });

  test("should allow updating name and is_active for own API keys", async () => {
    // Get a team with an owner
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT t.id as team_id, m.user_id 
       FROM "public"."team" t 
       JOIN "public"."membership" m ON t.id = m.team_id 
       WHERE m.role = 'OWNER' 
       LIMIT 1`,
    )) as {
      rows: Array<{
        team_id: string;
        user_id: string;
      }>;
    };

    const team = teams[0];
    const client = await getAPIUserClient({ user_id: team.user_id });

    // Create an API key
    const createKeyMutation = gql`
      mutation InsertKey($name: String!, $teamId: String!) {
        insert_api_key_one(object: { name: $name, team_id: $teamId }) {
          id
          team_id
          name
          is_active
        }
      }
    `;

    const createResponse = await client.mutate({
      mutation: createKeyMutation,
      variables: {
        name: "Test API Key",
        teamId: team.team_id,
      },
    });

    const apiKeyId = createResponse.data?.insert_api_key_one?.id;
    expect(apiKeyId).toBeDefined();

    // Update only name and is_active (legitimate update)
    const updateKeyMutation = gql`
      mutation UpdateKey($id: String!, $name: String!, $is_active: Boolean!) {
        update_api_key_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name, is_active: $is_active }
        ) {
          id
          team_id
          name
          is_active
        }
      }
    `;

    const updateResponse = await client.mutate({
      mutation: updateKeyMutation,
      variables: {
        id: apiKeyId,
        name: "Updated API Key Name",
        is_active: false,
      },
    });

    // This should succeed
    expect(updateResponse.data?.update_api_key_by_pk?.name).toBe(
      "Updated API Key Name",
    );
    expect(updateResponse.data?.update_api_key_by_pk?.is_active).toBe(false);
    expect(updateResponse.data?.update_api_key_by_pk?.team_id).toBe(
      team.team_id,
    );
  });

  test("non-owners should not be able to update API keys", async () => {
    // Get a team with an admin (not owner)
    const { rows: teams } = (await integrationDBExecuteQuery(
      `SELECT t.id as team_id, m.user_id 
       FROM "public"."team" t 
       JOIN "public"."membership" m ON t.id = m.team_id 
       WHERE m.role = 'ADMIN' 
       LIMIT 1`,
    )) as {
      rows: Array<{
        team_id: string;
        user_id: string;
      }>;
    };

    if (teams.length === 0) {
      console.log("No admin users found, skipping test");
      return;
    }

    const team = teams[0];

    // First create an API key as the owner
    const { rows: owners } = (await integrationDBExecuteQuery(
      `SELECT user_id FROM "public"."membership" 
       WHERE team_id = '${team.team_id}' AND role = 'OWNER' 
       LIMIT 1`,
    )) as { rows: Array<{ user_id: string }> };

    const ownerClient = await getAPIUserClient({ user_id: owners[0].user_id });

    const createKeyMutation = gql`
      mutation InsertKey($name: String!, $teamId: String!) {
        insert_api_key_one(object: { name: $name, team_id: $teamId }) {
          id
        }
      }
    `;

    const createResponse = await ownerClient.mutate({
      mutation: createKeyMutation,
      variables: {
        name: "Owner's API Key",
        teamId: team.team_id,
      },
    });

    const apiKeyId = createResponse.data?.insert_api_key_one?.id;

    // Now try to update as admin
    const adminClient = await getAPIUserClient({ user_id: team.user_id });

    const updateKeyMutation = gql`
      mutation UpdateKey($id: String!, $name: String!, $is_active: Boolean!) {
        update_api_key_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name, is_active: $is_active }
        ) {
          id
          name
        }
      }
    `;

    const updateResponse = await adminClient.mutate({
      mutation: updateKeyMutation,
      variables: {
        id: apiKeyId,
        name: "Admin tried to update",
        is_active: true,
      },
    });

    // Admin should not be able to update
    expect(updateResponse.data?.update_api_key_by_pk).toBeNull();
  });
});

/**
 * Integration tests for the api_key role's action insert permission.
 *
 * H1 Report Reference: #3846290
 *
 * The partner-only action columns (webhook_uri, webhook_pem,
 * app_flow_on_complete, post_action_deep_link_ios/android) are gated to partner
 * teams in the UI create/update flows via checkIfPartnerTeam(). That check only
 * runs in the Next.js server actions, but the public /api/v1/graphql proxy
 * forwards raw mutations to Hasura with the api_key role, so a non-partner team
 * could set these columns directly by calling insert_action_one. They are now
 * removed from the api_key insert permission — partners set them through the
 * service-role UI path — so Hasura rejects them regardless of the caller.
 */
describe("API key action insert permissions", () => {
  // Each entry is [column, GraphQL literal] embedded inline in the insert input.
  const PARTNER_ONLY_COLUMNS: Array<[string, string]> = [
    ["webhook_uri", '"https://attacker.example.com/webhook"'],
    ["webhook_pem", '"attacker-pem"'],
    ["app_flow_on_complete", "VERIFY"],
    ["post_action_deep_link_ios", '"worldapp://attacker-ios"'],
    ["post_action_deep_link_android", '"worldapp://attacker-android"'],
  ];

  const getSeededApp = async () => {
    const { rows } = (await integrationDBExecuteQuery(
      `SELECT id AS app_id, team_id FROM "public"."app" WHERE team_id IS NOT NULL LIMIT 1`,
    )) as { rows: Array<{ app_id: string; team_id: string }> };

    expect(rows.length).toBe(1);
    return rows[0];
  };

  test("api_key role can insert an action with the standard columns", async () => {
    const { app_id, team_id } = await getSeededApp();
    const client = await getAPIClient({ team_id });

    const mutation = gql`
      mutation InsertAction($object: action_insert_input!) {
        insert_action_one(object: $object) {
          id
          action
          name
        }
      }
    `;

    const response = await client.mutate({
      mutation,
      variables: {
        object: {
          app_id,
          action: "regression_standard_action",
          name: "Standard Action",
          description: "created via api_key role",
          max_verifications: 3,
        },
      },
    });

    expect(response.data?.insert_action_one?.id).toEqual(
      expect.stringContaining("action_"),
    );
  });

  test.each(PARTNER_ONLY_COLUMNS)(
    "api_key role cannot set partner-only column '%s' on insert",
    async (column, literal) => {
      const { app_id, team_id } = await getSeededApp();
      const client = await getAPIClient({ team_id });

      // The forbidden field is placed inline in the insert input so it is
      // validated against the api_key role's action_insert_input type.
      const mutation = gql`
        mutation InsertActionWithPartnerColumn($app_id: String!) {
          insert_action_one(
            object: {
              app_id: $app_id
              action: "regression_${column}"
              ${column}: ${literal}
            }
          ) {
            id
          }
        }
      `;

      let error: any;
      try {
        await client.mutate({ mutation, variables: { app_id } });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.graphQLErrors?.[0]?.message).toContain(
        `field '${column}' not found in type: 'action_insert_input'`,
      );

      // The mutation is rejected at validation, so nothing is inserted.
      const { rows } = (await integrationDBExecuteQuery(
        `SELECT COUNT(*)::int AS count FROM "public"."action" WHERE action = 'regression_${column}'`,
      )) as { rows: Array<{ count: number }> };
      expect(rows[0].count).toBe(0);
    },
  );
});

/**
 * Regression for the api_key role's action UPDATE permission.
 *
 * H1 Report Reference: #3846290 / VULN-6369 (CE25-C014)
 *
 * The partner webhook SSRF PoC upserts webhook_uri/webhook_pem through
 * `on_conflict: { update_columns: [...] }`, which is governed by the same
 * update-column permission as a direct `_set`. The partner-only columns are
 * excluded from the api_key update permission, so Hasura rejects them in
 * 'action_set_input' regardless of the caller — partners set them through the
 * service-role UI path, which additionally validates the webhook URL.
 */
describe("API key action update permissions", () => {
  const PARTNER_ONLY_COLUMNS: Array<[string, string]> = [
    ["webhook_uri", '"https://attacker.example.com/webhook"'],
    ["webhook_pem", '"attacker-pem"'],
    ["app_flow_on_complete", "VERIFY"],
    ["post_action_deep_link_ios", '"worldapp://attacker-ios"'],
    ["post_action_deep_link_android", '"worldapp://attacker-android"'],
  ];

  const getSeededApp = async () => {
    const { rows } = (await integrationDBExecuteQuery(
      `SELECT id AS app_id, team_id FROM "public"."app" WHERE team_id IS NOT NULL LIMIT 1`,
    )) as { rows: Array<{ app_id: string; team_id: string }> };

    expect(rows.length).toBe(1);
    return rows[0];
  };

  test.each(PARTNER_ONLY_COLUMNS)(
    "api_key role cannot set partner-only column '%s' on update",
    async (column, literal) => {
      const { app_id, team_id } = await getSeededApp();
      const client = await getAPIClient({ team_id });

      // The forbidden field is placed inline in _set so it is validated against
      // the api_key role's action_set_input type.
      const mutation = gql`
        mutation UpdateActionWithPartnerColumn($app_id: String!) {
          update_action(
            where: { app_id: { _eq: $app_id } }
            _set: { ${column}: ${literal} }
          ) {
            affected_rows
          }
        }
      `;

      let error: any;
      try {
        await client.mutate({ mutation, variables: { app_id } });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.graphQLErrors?.[0]?.message).toContain(
        `field '${column}' not found in type: 'action_set_input'`,
      );
    },
  );
});
