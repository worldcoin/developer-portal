import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextResponse } from "next/server";

const signedFetch = createSignedFetcher({
  service: "execute-api",
  region: "us-east-1",
});

export const GET = async () => {
  // NOTE: Ensure the environment variable is present
  if (!process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT) {
    return NextResponse.json(
      {
        error:
          "Missing NEXT_SERVER_PAYMENTS_TEST_ENDPOINT environment variable",
      },
      { status: 500 },
    );
  }

  const url = `${process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT}?nocache=${new Date().getTime().toString()}`;

  try {
    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);

      return new NextResponse(
        JSON.stringify({ error: "Failed to parse JSON response" }),
        {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        },
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.error("Request failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
