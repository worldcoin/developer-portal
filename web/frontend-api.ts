import {
  ApolloClient,
  ApolloQueryResult,
  createHttpLink,
  InMemoryCache,
  QueryOptions,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { authLogic } from "logics/authLogic";
import { toast } from "react-toastify";

interface RequestOptions extends RequestInit {
  json?: Record<string, any>;
}

const handleError = async (response: unknown): Promise<void> => {
  let detail = "";

  try {
    // @ts-ignore
    detail = response?.detail;
  } catch {}

  toast.error(detail || "Something went wrong. Please try again.");
};

export const restAPIRequest = async <T>(
  path: string,
  requestOptions?: RequestOptions
): Promise<T> => {
  let response = null;
  const { json, headers, ...restOfRequestOptions } = requestOptions || {};

  try {
    response = await fetch(`/api/v1${path}`, {
      ...restOfRequestOptions,
      body: json ? JSON.stringify(json) : undefined,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    await handleError(e);
    throw e;
  }

  const jsonResponse = await response.json();

  if (!response?.ok) {
    await handleError(jsonResponse);
    throw jsonResponse || response;
  }

  return jsonResponse as T;
};

/**
 * Sends a GraphQL request from the frontend
 * @returns
 */
export const graphQLRequest = async <T>(
  queryOptions: QueryOptions
): Promise<ApolloQueryResult<T | null>> => {
  if (!authLogic.isMounted()) {
    throw new Error("`authLogic` is not mounted.");
  }

  const httpLink = createHttpLink({
    uri: "/api/v1/graphql",
  });

  if (!authLogic.values.token) {
    // Token not yet set, skip requests to avoid showing random errors to users
    return Promise.resolve({
      data: null,
      error: { message: "unauthenticated" },
    } as ApolloQueryResult<T | null>);
  }

  const authLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      authorization: `Bearer ${authLogic.values.token}`,
    },
  }));

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });

  try {
    return await client.query(queryOptions);
  } catch (e) {
    if ((e as Error).toString().includes("JWTExpired")) {
      authLogic.actions.logout();
      throw "JWT is expired. Please log in again.";
    } else {
      handleError(e);
      console.error(e);
      throw e;
    }
  }
};
