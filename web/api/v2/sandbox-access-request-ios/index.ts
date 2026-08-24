import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getInsertSandboxAccessRequestIosSdk } from "./graphql/insert-sandbox-access-request-ios.generated";
import { fetchSandboxAccessRequestIos } from "./server/fetch-sandbox-access-request-ios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ASC_EMAIL_UNIQUE_CONSTRAINT =
  "unique_sandbox_access_request_ios_asc_email";

const normalizeEmail = (email: unknown) => {
  if (typeof email !== "string") {
    return null;
  }

  // App Store Connect treats tester email identity case-insensitively. Store
  // one canonical representation so the database uniqueness constraint also
  // protects against case-only duplicates owned by different portal users.
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 &&
    normalized.length <= 254 &&
    EMAIL_REGEX.test(normalized)
    ? normalized
    : null;
};

const isAscEmailConflict = (error: unknown) => {
  const errors = (
    error as { response?: { errors?: unknown } } | null | undefined
  )?.response?.errors;
  return (
    Array.isArray(errors) &&
    errors.some(
      (graphqlError) =>
        graphqlError &&
        typeof graphqlError === "object" &&
        "message" in graphqlError &&
        typeof graphqlError.message === "string" &&
        graphqlError.message.includes(ASC_EMAIL_UNIQUE_CONSTRAINT),
    )
  );
};

const getAuthenticatedUser = async () => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;

  return user && userId ? { user, userId } : null;
};

export async function GET() {
  const authenticatedUser = await getAuthenticatedUser();
  if (!authenticatedUser) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const request = await fetchSandboxAccessRequestIos(
      authenticatedUser.userId,
    );
    return NextResponse.json({ success: true, request });
  } catch (error) {
    logger.error("Failed to look up iOS sandbox access request", {
      userId: authenticatedUser.userId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * Records one immutable App Store Connect enrollment request per portal user.
 * The caller supplies the ASC email and active team. Identity and portal email
 * always come from the authenticated session, and the team must belong to the
 * authenticated user.
 */
export async function POST(req: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser();
  if (!authenticatedUser) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const portalEmail = normalizeEmail(authenticatedUser.user.email);
  if (!portalEmail) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const ascEmail =
    body && typeof body === "object" && "asc_email" in body
      ? normalizeEmail(body.asc_email)
      : null;
  if (!ascEmail) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const teamId =
    body && typeof body === "object" && "team_id" in body ? body.team_id : null;
  if (typeof teamId !== "string" || teamId.length === 0) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const isTeamMember =
    authenticatedUser.user.hasura.memberships?.some(
      (membership) => membership.team?.id === teamId,
    ) ?? false;
  if (!isTeamMember) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    await getInsertSandboxAccessRequestIosSdk(
      client,
    ).InsertSandboxAccessRequestIos({
      asc_email: ascEmail,
      portal_email: portalEmail,
      team_id: teamId,
      user_id: authenticatedUser.userId,
    });

    const request = await fetchSandboxAccessRequestIos(
      authenticatedUser.userId,
      client,
    );
    if (!request) {
      throw new Error("iOS sandbox access request was not persisted");
    }

    return NextResponse.json({ success: true, request });
  } catch (error) {
    if (isAscEmailConflict(error)) {
      logger.warn("iOS sandbox ASC email is already requested", {
        userId: authenticatedUser.userId,
        failureClass: "asc_email_conflict",
      });
      return NextResponse.json({ success: false }, { status: 409 });
    }

    logger.error("Failed to record iOS sandbox access request", {
      userId: authenticatedUser.userId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
