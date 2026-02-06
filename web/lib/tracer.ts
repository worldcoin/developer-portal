import ddTrace from "dd-trace";

export type GraphQlSdkWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: unknown,
) => Promise<T>;

export async function withSpan<T>(
  operationName: string,
  tags: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  return ddTrace.trace(operationName, { tags }, fn);
}

/**
 * Returns a `GraphQlSdkWrapper` that wraps every GraphQL SDK call in a
 * dd-trace span so we get per-operation latency in Datadog.
 *
 * Span name:  `{spanPrefix}.{OperationName}`
 * Tags:       staticTags + graphql_operation_type
 */
export function createGraphQlDbTracer(
  spanPrefix: string,
  staticTags: Record<string, string | number | boolean>,
): GraphQlSdkWrapper {
  return async (action, operationName, operationType) => {
    return ddTrace.trace(
      `${spanPrefix}.${operationName}`,
      {
        tags: {
          ...staticTags,
          ...(operationType
            ? { graphql_operation_type: operationType }
            : undefined),
        },
      },
      () => action(),
    );
  };
}
