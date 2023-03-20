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
        baseTypesPath: "graphql/graphql.ts",
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
    "src/scenes": {
      documents: "src/scenes/**/*.graphql",
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "graphql/graphql.ts",
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
};
