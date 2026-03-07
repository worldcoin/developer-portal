import axios from "axios";

describe("GraphQL Introspection", () => {
  const hasAdminSecret = Boolean(process.env.HASURA_GRAPHQL_ADMIN_SECRET);

  beforeAll(() => {
    const requiredEnvVars = ["HASURA_GRAPHQL_URL"];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Required environment variables are not set: ${missingEnvVars.join(", ")}`,
      );
    }
  });

  it("rejects introspection queries from unauthenticated requests", async () => {
    const response = await axios.post(
      process.env.HASURA_GRAPHQL_URL!,
      { query: "{ __schema { types { name } } }" },
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      },
    );
    // Hasura returns 200 with an errors array when introspection is disabled
    expect(response.data.errors).toBeDefined();
    expect(response.data.errors[0].message).toMatch(/introspection/i);
  });

  (hasAdminSecret ? it : it.skip)(
    "allows introspection queries with the admin secret",
    async () => {
      const response = await axios.post(
        process.env.HASURA_GRAPHQL_URL!,
        { query: "{ __schema { types { name } } }" },
        {
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          },
        },
      );
      expect(response.data.data.__schema).toBeDefined();
      expect(response.data.errors).toBeUndefined();
    },
  );
});
