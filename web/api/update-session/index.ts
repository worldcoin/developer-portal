import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { NextRequest, NextResponse } from "next/server";

const HASURA_ALLOWLIST = [
  "id",
  "name",
  "email",
  "world_id_nullifier",
  "posthog_id",
  "is_allow_tracking",
  "memberships",
] as const;

type HasuraAllowlistedKey = (typeof HASURA_ALLOWLIST)[number];
type HasuraPayload = Partial<Record<HasuraAllowlistedKey, unknown>>;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const pickAllowlistedHasuraFields = (input: HasuraPayload = {}) =>
  Object.fromEntries(
    HASURA_ALLOWLIST.map((key) => [
      key,
      input[key as keyof HasuraPayload],
    ]).filter(([, value]) => value !== undefined),
  ) as HasuraPayload;

export const POST = withApiAuthRequired(async (req: NextRequest) => {
  const res = NextResponse.json({ success: true });
  const body = await req.json();
  const user = body?.user;
  let session = await getSession(req, res);

  if (!session) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  if (!isObjectRecord(user)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // Split this out and return a 401: Unauthorized
  if (session.user.hasura.id !== user.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const allowlistedCurrentHasura = pickAllowlistedHasuraFields(
    session.user.hasura,
  );
  const allowlistedUpdates = pickAllowlistedHasuraFields(user);

  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...allowlistedCurrentHasura,
        ...allowlistedUpdates,
      },
    },
  };

  session = updatedSession;
  await updateSession(req, res, session);
  return res;
});
