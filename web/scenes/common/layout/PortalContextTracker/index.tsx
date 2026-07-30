"use client";

import {
  PORTAL_CONTEXT_COOKIE,
  parsePortalContextCookie,
  serializePortalContext,
} from "@/lib/portal-context";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export const PortalContextTracker = () => {
  const { user } = useUser() as Auth0SessionUser;
  const { teamId, appId } = useParams<{
    teamId?: string;
    appId?: string;
  }>();
  const userId = user?.hasura?.id;

  useEffect(() => {
    if (!userId || !teamId) {
      return;
    }

    const previous = parsePortalContextCookie(document.cookie);
    const rememberedAppId =
      appId ??
      (previous?.userId === userId && previous.teamId === teamId
        ? previous.appId
        : undefined);
    const next = {
      userId,
      teamId,
      ...(rememberedAppId ? { appId: rememberedAppId } : {}),
    };

    if (
      previous?.userId === next.userId &&
      previous.teamId === next.teamId &&
      previous.appId === next.appId
    ) {
      return;
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";

    // Deliberately omit Max-Age/Expires so the preference follows the browser
    // session while remaining available to other tabs on the same host.
    document.cookie =
      `${PORTAL_CONTEXT_COOKIE}=${serializePortalContext(next)}` +
      `; Path=/; SameSite=Lax${secure}`;
  }, [appId, teamId, userId]);

  return null;
};
