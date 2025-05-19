import { gql } from "@apollo/client";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import { getAPIServiceClient, getAPIUserClient } from "./test-utils";

beforeEach(integrationDBClean);
describe("redirect model", () => {
  test("allows valid URLs", async () => {
    const client = await getAPIServiceClient();
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."action" LIMIT 1;',
    );
    const action_id = rows[0].id;
    const insertRedirectMutation = gql`
      mutation InsertRedirect($redirect_uri: String!, $action_id: String!) {
        insert_redirect_one(
          object: { redirect_uri: $redirect_uri, action_id: $action_id }
        ) {
          redirect_uri
        }
      }
    `;
    const validRedirects = [
      "https://example.com",
      "https://example.com/",
      "https://example.com/path",
      "https://example.com/path/",
      "https://example.com/path?query=string",
      "https://example.com/path?query=string&query2=string2",
      "http://localhost:3000/authorize", // localhost
      "http://localhost:8000/authorize?query=string", // localhost
      "https://localhost/123", // localhost
    ];
    for (const redirect_uri of validRedirects) {
      const response = await client.mutate({
        mutation: insertRedirectMutation,
        variables: { redirect_uri, action_id },
      });
      expect(response.errors).toBeUndefined();
      expect(response.data?.insert_redirect_one.redirect_uri).toEqual(
        redirect_uri,
      );
    }
  });

  test("prevent invalid URLs", async () => {
    const client = await getAPIUserClient();
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."action" LIMIT 1;',
    );
    const action_id = rows[0].id;
    const insertRedirectMutation = gql`
      mutation InsertRedirect($redirect_uri: String!, $action_id: String!) {
        insert_redirect_one(
          object: { redirect_uri: $redirect_uri, action_id: $action_id }
        ) {
          redirect_uri
        }
      }
    `;
    const validRedirects = [
      "https://example.com/path?query=string&query2=string2#fragment", // fragments not supported
      "invalid-url", // invalid URL
      "https://example.com:3000/3030303", // port not supported (except localhost)
      "email@email.com",
      "https://example/path",
      "@example.com",
    ];
    for (const redirect_uri of validRedirects) {
      const response = await client.mutate({
        mutation: insertRedirectMutation,
        variables: { redirect_uri, action_id },
        errorPolicy: "all",
      });
      expect(response.errors).toEqual([
        {
          extensions: expect.objectContaining({
            code: "data-exception",
          }),
          message: "Invalid URL format.",
        },
      ]);
      expect(response.data?.insert_redirect_one.redirect_uri).toBeUndefined();
    }
  });

  test("URLs must be over HTTPs unless localhost", async () => {
    const client = await getAPIUserClient();
    const { rows } = await integrationDBExecuteQuery(
      'SELECT id FROM "public"."action" LIMIT 1;',
    );
    const action_id = rows[0].id;
    const insertRedirectMutation = gql`
      mutation InsertRedirect($redirect_uri: String!, $action_id: String!) {
        insert_redirect_one(
          object: { redirect_uri: $redirect_uri, action_id: $action_id }
        ) {
          redirect_uri
        }
      }
    `;
    const validRedirects = [
      "http://example.com/",
      "http://example.com/123",
      "http://example.com/123?query=string",
    ];
    for (const redirect_uri of validRedirects) {
      const response = await client.mutate({
        mutation: insertRedirectMutation,
        variables: { redirect_uri, action_id },
        errorPolicy: "all",
      });
      expect(response.errors).toEqual([
        {
          extensions: expect.objectContaining({
            code: "data-exception",
          }),
          message: "URL must use HTTPS protocol unless it is localhost.",
        },
      ]);
      expect(response.data?.insert_redirect_one.redirect_uri).toBeUndefined();
    }
  });
});
