import { NextResponse } from "next/server";

export const GET = async () => {
  if (!process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT) {
    return NextResponse.json({ error: "Missing environment" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT}?nocache=${new Date().getTime().toString()}`,
      { next: { revalidate: 0 } },
    );

    let data: any = null;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        statusText: "Internal Server Error",
      });
    }

    return new NextResponse(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
