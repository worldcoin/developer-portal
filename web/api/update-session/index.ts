import { getSession, updateSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const res = NextResponse.json({ success: true });
  const body = await req.json();
  const user = body.user as Record<string, any>;
  let session = await getSession(req, res);

  if (!session) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...user,
      },
    },
  };

  session = updatedSession;
  await updateSession(req, res, session);
  return res;
};
