const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

const fs = require("fs");
const prettier = require("prettier");

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: "graphql/graphql.schema.json",
  ignoreNoDocuments: true,
  config: {
    defaultScalarType: "unknown",
    scalars: {
      timestamp: "string",
      timestamptz: "string",
      jsonb: "any",
      json: "any",
      numeric: "number",
      _text: "any",
    },
  },

  generates: {
    "graphql/graphql.ts": {
      plugins: [
        {
          add: {
            placement: "prepend",
            content:
              "/* eslint-disable import/no-relative-parent-imports -- auto generated file */",
          },
        },
        "typescript",
      ],
    },

    api: {
      documents: ["api/**/*.graphql", "api/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content:
              "/* eslint-disable import/no-relative-parent-imports -- auto generated file */",
          },
        },
        "typescript-operations",
        "typescript-graphql-request",
      ],
    },

    "scenes/server": {
      documents: ["scenes/**/server/**/*.graphql", "scenes/**/server/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content: "/* eslint-disable */",
          },
        },
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        withMutationFn: true,
      },
    },

    "scenes/client": {
      documents: ["scenes/**/client/**/*.graphql", "scenes/**/client/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content: "/* eslint-disable */",
          },
        },
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withMutationFn: true,
      },
    },

    "components/client": {
      documents: [
        "components/**/client/**/*.graphql",
        "components/**/client/**/*.gql",
      ],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content: "/* eslint-disable */",
          },
        },
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withMutationFn: true,
      },
    },

    app: {
      documents: ["app/**/*.graphql", "app/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content: "/* eslint-disable */",
          },
        },
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withMutationFn: true,
      },
    },

    "lib/permissions": {
      documents: ["lib/**/server/**/*.graphql", "lib/**/server/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content: "/* eslint-disable */",
          },
        },
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        withMutationFn: true,
      },
    },

    "tests/e2e": {
      documents: ["tests/e2e/**/*.graphql", "tests/e2e/**/*.gql"],
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "~@/graphql/graphql",
        extension: ".generated.ts",
      },
      plugins: [
        {
          add: {
            placement: "prepend",
            content:
              "/* eslint-disable import/no-relative-parent-imports -- auto generated file */",
          },
        },
        "typescript-operations",
        "typescript-graphql-request",
      ],
    },
  },

  hooks: {
    afterAllFileWrite: [
      async (...filePaths) => {
        for (const path of filePaths) {
          const rawText = fs.readFileSync(path, "utf8");
          const formattedText = await prettier.format(rawText, {
            parser: "typescript",
          });

          fs.writeFileSync(path, formattedText);
        }
      },
    ],
  },
};
