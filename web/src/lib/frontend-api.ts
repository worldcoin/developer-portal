import {
  ApolloClient,
  ApolloQueryResult,
  createHttpLink,
  InMemoryCache,
  QueryOptions,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { toast } from "react-toastify";
import { useAuthStore } from "src/stores/authStore";

interface RequestOptions extends RequestInit {
  json?: Record<string, any>;
  customErrorHandling?: boolean;
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
  const { json, headers, customErrorHandling, ...restOfRequestOptions } =
    requestOptions || {};

  try {
    response = await fetch(`/api/v1${path}`, {
      ...restOfRequestOptions,
      body: json ? JSON.stringify(json) : undefined,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (!customErrorHandling) {
      await handleError(e);
    }
    throw e;
  }

  const jsonResponse = await response.json();

  if (!response?.ok) {
    if (!customErrorHandling) {
      await handleError(jsonResponse);
    }
    throw jsonResponse || response;
  }

  return jsonResponse as T;
};

/**
 * Sends a GraphQL request from the frontend
 * @returns
 */
export const graphQLRequest = async <T>(
  queryOptions: QueryOptions,
  customErrorHandling?: boolean
): Promise<ApolloQueryResult<T | null>> => {
  const httpLink = createHttpLink({
    uri: "/api/v1/graphql",
  });

  const authLink = setContext(async (_, { headers }) => ({
    headers,
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
      window.location.href = "/logout";
      throw "JWT is expired. Please log in again.";
    }

    if (!customErrorHandling) {
      handleError(e);
    }

    console.error(e);
    throw e;
  }
};
