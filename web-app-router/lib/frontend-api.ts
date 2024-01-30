import { toast } from "react-toastify";

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
