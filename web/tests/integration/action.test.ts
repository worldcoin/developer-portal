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

    expect(signInWithWorldIDCount).toEqual(8); // 8 apps are created (non-archived)
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
});
