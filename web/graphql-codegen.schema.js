const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: [
    {
      ["http://localhost:8080/v1/graphql"]: {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
        },
      },
    },
  ],
  generates: {
    "graphql/graphql.schema.json": {
      plugins: ["introspection"],
    },
  },
};
