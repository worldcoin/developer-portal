export const PORTAL_CONTEXT_COOKIE = "portal_context_v1";

// Browser-local navigation preference only. Every server-side consumer must
// validate these untrusted IDs against the current user before redirecting.
export type PortalContext = {
  userId: string;
  teamId: string;
  appId?: string;
};

const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 128;

export const serializePortalContext = (context: PortalContext): string =>
  encodeURIComponent(JSON.stringify(context));

export const parsePortalContext = (
  raw: string | null | undefined,
): PortalContext | undefined => {
  if (!raw) {
    return undefined;
  }

  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<PortalContext>;

    if (
      !isIdentifier(value.userId) ||
      !isIdentifier(value.teamId) ||
      (value.appId !== undefined && !isIdentifier(value.appId))
    ) {
      return undefined;
    }

    return {
      userId: value.userId,
      teamId: value.teamId,
      ...(value.appId ? { appId: value.appId } : {}),
    };
  } catch {
    return undefined;
  }
};

export const parsePortalContextCookie = (
  cookieHeader: string,
): PortalContext | undefined => {
  const prefix = `${PORTAL_CONTEXT_COOKIE}=`;
  const raw = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return parsePortalContext(raw);
};

export const selectPreferredTeamId = ({
  context,
  userId,
  teamIds,
}: {
  context?: PortalContext;
  userId: string;
  teamIds: readonly string[];
}): string | undefined => {
  if (context?.userId === userId && teamIds.includes(context.teamId)) {
    return context.teamId;
  }

  return teamIds[0];
};

export const selectPreferredAppId = ({
  context,
  userId,
  teamId,
}: {
  context?: PortalContext;
  userId: string;
  teamId: string;
}): string | undefined =>
  context?.userId === userId && context.teamId === teamId
    ? context.appId
    : undefined;
