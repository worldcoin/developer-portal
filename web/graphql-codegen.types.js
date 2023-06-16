const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

const fs = require("fs");
const prettier = require("prettier");

/** @type {import('@graphql-codegen/cli').CodegenConfig} */
module.exports = {
  schema: "src/graphql/graphql.schema.json",
  ignoreNoDocuments: true,
  generates: {
    "src/graphql/graphql.ts": {
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

    "src/api": {
      documents: "src/api/**/*.graphql",
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
      config: {
        noGraphQLTag: true,
      },
    },

    "src/scenes": {
      documents: "src/scenes/**/*.graphql",
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

    "src/components": {
      documents: "src/components/**/*.graphql",
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
  },

  hooks: {
    afterAllFileWrite: [
      (...filePaths) => {
        for (const path of filePaths) {
          const rawText = fs.readFileSync(path, "utf8");
          const formattedText = prettier.format(rawText, {
            parser: "typescript",
          });
          fs.writeFileSync(path, formattedText);
        }
      },
    ],
  },
};
