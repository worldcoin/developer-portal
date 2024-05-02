import { NextResponse } from "next/server";

export const GET = async () => {
  if (!process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT) {
    return NextResponse.json({ error: "Missing environment" }, { status: 500 });
  }

  const res = await fetch(process.env.NEXT_SERVER_PAYMENTS_TEST_ENDPOINT);

  if (res.status !== 200) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
};
