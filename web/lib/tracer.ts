import ddTrace from "dd-trace";

import type { SdkFunctionWrapper } from "@/api/v4/verify/graphql/fetch-action-v4.generated";

export async function withSpan<T>(
  operationName: string,
  tags: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  return ddTrace.trace(operationName, { tags }, fn);
}

/**
 * Returns an `SdkFunctionWrapper` that wraps every GraphQL SDK call in a
 * dd-trace span so we get per-operation latency in Datadog.
 *
 * Span name:  `{spanPrefix}.{OperationName}`
 * Tags:       staticTags + scalar GraphQL variables + graphql_operation_type
 */
export function createGraphQlDbTracer(
  spanPrefix: string,
  staticTags: Record<string, string | number | boolean>,
): SdkFunctionWrapper {
  return async (action, operationName, operationType, variables) => {
    const variableTags: Record<string, string | number | boolean> = {};

    if (variables && typeof variables === "object") {
      for (const [key, value] of Object.entries(variables)) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          variableTags[`graphql.var.${key}`] = value;
        }
      }
    }

    return ddTrace.trace(
      `${spanPrefix}.${operationName}`,
      {
        tags: {
          ...staticTags,
          ...variableTags,
          ...(operationType
            ? { graphql_operation_type: operationType }
            : undefined),
        },
      },
      () => action(),
    );
  };
}
