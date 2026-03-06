import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { NextRequest, NextResponse } from "next/server";

export const POST = withApiAuthRequired(async (req: NextRequest) => {
  const res = NextResponse.json({ success: true });
  const body = await req.json();
  const user = body.user as Record<string, any>;
  let session = await getSession(req, res);

  if (!session) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  // Split this out and return a 401: Unauthorized
  if (session.user.hasura.id != user.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const {
    id,
    name,
    email,
    world_id_nullifier,
    posthog_id,
    is_allow_tracking,
    memberships,
  } = user;

  const allowlistedUpdates = Object.fromEntries(
    Object.entries({
      id,
      name,
      email,
      world_id_nullifier,
      posthog_id,
      is_allow_tracking,
      memberships,
    }).filter(([, v]) => v !== undefined),
  );

  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...session.user.hasura,
        ...allowlistedUpdates,
      },
    },
  };

  session = updatedSession;
  await updateSession(req, res, session);
  return res;
});
