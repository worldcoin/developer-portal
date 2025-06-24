import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIUserClient } from "./test-utils";

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
