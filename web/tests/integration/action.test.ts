import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIServiceClient, getAPIUserClient } from "./test-utils";

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBClean);

describe("service role", () => {
  test("can select actions", async () => {
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."app" WHERE "is_archived" = true LIMIT 1;',
    );

    const client = await getAPIServiceClient();
    const query = gql(`query ListActions {
      action(order_by: {created_at: asc}) {
        id
        name
        description
      }
    }    
    `);

    const response = await client.query({ query });

    expect(response.data.action[0]).toEqual(
      expect.objectContaining({
        id: expect.stringContaining("action_"),
      }),
    );

    let signInWithWorldIDCount = 0;

    for (const row of response.data.action) {
      // Service role should not see archived actions
      expect(row.app_id).not.toEqual(rows[0].id);
      if (row.name === "Sign in with World ID") {
        signInWithWorldIDCount++;
      }
    }

    expect(signInWithWorldIDCount).toEqual(1); // only one app with sign in with world id
  });

  test("can query return_to fields from actions", async () => {
    const client = await getAPIServiceClient();
    const query = gql(`query GetActionsWithReturnUrl {
      action(limit: 5) {
        id
        name
        action
        post_action_deep_link_android
        post_action_deep_link_ios
      }
    }`);

    const response = await client.query({ query });

    expect(response.data.action.length).toBeGreaterThan(0);
    // Verify return_to fields exist in response (may be null or string)
    response.data.action.forEach((action: { [key: string]: string | null }) => {
      expect(action).toHaveProperty("post_action_deep_link_android");
      expect(action).toHaveProperty("post_action_deep_link_ios");
      expect(
        action.post_action_deep_link_android === null ||
          action.post_action_deep_link_android === undefined ||
          typeof action.post_action_deep_link_android === "string",
      ).toBe(true);
      expect(
        action.post_action_deep_link_ios === null ||
          action.post_action_deep_link_ios === undefined ||
          typeof action.post_action_deep_link_ios === "string",
      ).toBe(true);
    });
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
        "ApolloError: field 'delete_action' not found in type: 'mutation_root'",
      );
    }
  });
});

describe("user role", () => {
  test("Owner can update sign in with World ID", async () => {
    const serviceClient = await getAPIServiceClient();

    const query = gql(`query GetUserId {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        app {
          team {
            memberships(where: {role: {_eq: OWNER}}) {
              user {
                id
              }
            }
          }
        }
      }
    }`);

    const res = (await serviceClient.query({ query })) as {
      data: {
        action: [
          {
            id: string;
            app: {
              team: {
                memberships: [
                  {
                    user: {
                      id: string;
                    };
                  },
                ];
              };
            };
          },
        ];
      };
    };

    const ownerUserId = res.data.action[0].app.team.memberships[0].user.id;
    const actionId = res.data.action[0].id;

    const client = await getAPIUserClient({
      user_id: ownerUserId,
    });

    const url = "http://example.com";

    const mutation = gql(`
      mutation UpdateAction($id: String!) {
        update_action_by_pk(
          pk_columns: { id: $id }
          _set: { privacy_policy_uri: "${url}" }
        ) {
          privacy_policy_uri
        }
      }
    `);

    const response = await client.mutate({
      mutation,
      variables: {
        id: actionId,
      },
    });

    expect(response.data.update_action_by_pk.privacy_policy_uri).toEqual(url);
  });

  test("Owner can delete sign in with World ID", async () => {
    const serviceClient = await getAPIServiceClient();

    const query = gql(`query GetUserId {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        app {
          team {
            memberships(where: {role: {_eq: OWNER}}) {
              user {
                id
              }
            }
          }
          id
        }
      }
    }`);

    const res = (await serviceClient.query({ query })) as {
      data: {
        action: [
          {
            id: string;
            app: {
              team: {
                memberships: [
                  {
                    user: {
                      id: string;
                    };
                  },
                ];
              };
              id: string;
            };
          },
        ];
      };
    };

    const ownerUserId = res.data.action[0].app.team.memberships[0].user.id;
    const appId = res.data.action[0].app.id;
    console.log(appId);

    const client = await getAPIUserClient({
      user_id: ownerUserId,
    });

    const mutation = gql(`
      mutation DeleteAction {
        delete_action(
         where: {action: {_eq: ""}, app_id: {_eq: "${appId}"}}
        ) {
          affected_rows
        }
      }
    `);

    const response = await client.mutate({
      mutation,
    });
    console.log(response);
    expect(response.data.delete_action.affected_rows).toEqual(0);
  });

  test("member can't update sign in with World ID privacy policy", async () => {
    const serviceClient = await getAPIServiceClient();

    const query = gql(`query GetUserId {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        app {
          team {
            memberships(where: {role: {_eq: MEMBER}}) {
              user {
                id
              }
            }
          }
        }
      }
    }`);

    const res = (await serviceClient.query({ query })) as {
      data: {
        action: [
          {
            id: string;
            app: {
              team: {
                memberships: [
                  {
                    user: {
                      id: string;
                    };
                  },
                ];
              };
            };
          },
        ];
      };
    };

    const ownerUserId = res.data.action[0].app.team.memberships[0].user.id;
    const actionId = res.data.action[0].id;

    const client = await getAPIUserClient({
      user_id: ownerUserId,
    });

    const mutation = gql`
      mutation UpdateAction($id: String!) {
        update_action_by_pk(
          pk_columns: { id: $id }
          _set: { privacy_policy_uri: "http://example.com" }
        ) {
          id
        }
      }
    `;

    const response = await client.mutate({
      mutation,
      variables: {
        id: actionId,
      },
    });

    expect(response.data.update_action_by_pk).toBeNull();
  });

  test("User can't update webhook_uri and webhook_pem", async () => {
    const serviceClient = await getAPIServiceClient();
    const query = gql(`query GetUserId {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        app {
          team {
            memberships(where: {role: {_eq: OWNER}}) {
              user {
                id
              }
            }
          }
        }
      }
    }`);

    const res = (await serviceClient.query({ query })) as {
      data: {
        action: [
          {
            id: string;
            app: {
              team: {
                memberships: [
                  {
                    user: {
                      id: string;
                    };
                  },
                ];
              };
            };
          },
        ];
      };
    };

    const ownerUserId = res.data.action[0].app.team.memberships[0].user.id;
    const actionId = res.data.action[0].id;
    const client = await getAPIUserClient({
      user_id: ownerUserId,
    });

    const mutation = gql`
      mutation UpdateAction($id: String!) {
        update_action_by_pk(
          pk_columns: { id: $id }
          _set: { webhook_uri: "http://example.com", webhook_pem: "pem" }
        ) {
          id
        }
      }
    `;

    expect(
      client.mutate({
        mutation,
        variables: {
          id: actionId,
        },
      }),
    ).rejects.toThrow();
  });

  test("Service role can update return_to fields", async () => {
    const serviceClient = await getAPIServiceClient();

    // Get an action
    const query = gql(`query GetAction {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        post_action_deep_link_android
        post_action_deep_link_ios
      }
    }`);

    const queryRes = await serviceClient.query({ query });
    const actionId = queryRes.data.action[0].id;
    const originalReturnUrlAndroid =
      queryRes.data.action[0].post_action_deep_link_android;
    const originalReturnUrlIos =
      queryRes.data.action[0].post_action_deep_link_ios;

    const newReturnUrlAndroid = "https://example.com/return/android";
    const newReturnUrlIos = "https://example.com/return/ios";

    // Update return_to fields
    const mutation = gql`
      mutation UpdateAction(
        $id: String!
        $returnUrlAndroid: String
        $returnUrlIos: String
      ) {
        update_action_by_pk(
          pk_columns: { id: $id }
          _set: {
            post_action_deep_link_android: $returnUrlAndroid
            post_action_deep_link_ios: $returnUrlIos
          }
        ) {
          id
          post_action_deep_link_android
          post_action_deep_link_ios
        }
      }
    `;

    const response = await serviceClient.mutate({
      mutation,
      variables: {
        id: actionId,
        returnUrlAndroid: newReturnUrlAndroid,
        returnUrlIos: newReturnUrlIos,
      },
    });

    expect(
      response.data.update_action_by_pk.post_action_deep_link_android,
    ).toEqual(newReturnUrlAndroid);
    expect(response.data.update_action_by_pk.post_action_deep_link_ios).toEqual(
      newReturnUrlIos,
    );

    // Restore original value
    await serviceClient.mutate({
      mutation,
      variables: {
        id: actionId,
        returnUrlAndroid: originalReturnUrlAndroid,
        returnUrlIos: originalReturnUrlIos,
      },
    });
  });

  test("Service role can set return_to fields to null", async () => {
    const serviceClient = await getAPIServiceClient();

    // Get an action
    const query = gql(`query GetAction {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        post_action_deep_link_android
        post_action_deep_link_ios
      }
    }`);

    const queryRes = await serviceClient.query({ query });
    const actionId = queryRes.data.action[0].id;
    const originalReturnUrlAndroid =
      queryRes.data.action[0].post_action_deep_link_android;
    const originalReturnUrlIos =
      queryRes.data.action[0].post_action_deep_link_ios;

    // Set return_to fields to null
    const mutation = gql`
      mutation UpdateAction($id: String!) {
        update_action_by_pk(
          pk_columns: { id: $id }
          _set: {
            post_action_deep_link_android: null
            post_action_deep_link_ios: null
          }
        ) {
          id
          post_action_deep_link_android
          post_action_deep_link_ios
        }
      }
    `;

    const response = await serviceClient.mutate({
      mutation,
      variables: {
        id: actionId,
      },
    });

    expect(
      response.data.update_action_by_pk.post_action_deep_link_android,
    ).toBeNull();
    expect(
      response.data.update_action_by_pk.post_action_deep_link_ios,
    ).toBeNull();

    // Restore original value
    await serviceClient.mutate({
      mutation: gql`
        mutation UpdateAction(
          $id: String!
          $returnUrlAndroid: String
          $returnUrlIos: String
        ) {
          update_action_by_pk(
            pk_columns: { id: $id }
            _set: {
              post_action_deep_link_android: $returnUrlAndroid
              post_action_deep_link_ios: $returnUrlIos
            }
          ) {
            id
            post_action_deep_link_android
            post_action_deep_link_ios
          }
        }
      `,
      variables: {
        id: actionId,
        returnUrlAndroid: originalReturnUrlAndroid,
        returnUrlIos: originalReturnUrlIos,
      },
    });
  });

  test("Service role can query return_to fields from action", async () => {
    const serviceClient = await getAPIServiceClient();

    const query = gql(`query GetActionWithReturnUrl {
      action(where: {action: {_eq: ""}}, limit: 1) {
        id
        name
        action
        post_action_deep_link_android
        post_action_deep_link_ios
      }
    }`);

    const response = await serviceClient.query({ query });

    expect(response.data.action[0]).toHaveProperty(
      "post_action_deep_link_android",
    );
    expect(response.data.action[0]).toHaveProperty("post_action_deep_link_ios");
    expect(
      response.data.action[0].post_action_deep_link_android === null ||
        response.data.action[0].post_action_deep_link_android === undefined ||
        typeof response.data.action[0].post_action_deep_link_android ===
          "string",
    ).toBe(true);
    expect(
      response.data.action[0].post_action_deep_link_ios === null ||
        response.data.action[0].post_action_deep_link_ios === undefined ||
        typeof response.data.action[0].post_action_deep_link_ios === "string",
    ).toBe(true);
  });
});
