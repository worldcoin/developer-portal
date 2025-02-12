const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: [
    {
      [process.env.NEXT_PUBLIC_GRAPHQL_API_URL]: {
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
