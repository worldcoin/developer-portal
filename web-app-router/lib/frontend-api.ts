interface RequestOptions extends RequestInit {
  json?: Record<string, any>;
  customErrorHandling?: boolean;
}

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
      console.warn(e);
    }
    throw e;
  }

  const jsonResponse = await response.json();

  if (!response?.ok) {
    if (!customErrorHandling) {
      console.warn(jsonResponse);
    }
    throw jsonResponse || response;
  }

  return jsonResponse as T;
};
