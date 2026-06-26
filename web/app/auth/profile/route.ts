import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

// useUser() from @auth0/nextjs-auth0 v4 fetches this endpoint to hydrate the
// client-side user. Without it every useUser() call returns null.
export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(session.user);
}
