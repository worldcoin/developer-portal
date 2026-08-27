import { isOriginSameAsEffectiveHost } from "@/api/helpers/csrf";
import {
  authenticateAdminRequest,
  canReviewApps,
  isAdminReviewerPortalEnabled,
} from "@/lib/admin-auth";
import type { AdminUser } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { reviewerApiJson } from "./response";

type ReviewerApiAuthResult =
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse };

const isJsonRequest = (req: NextRequest) =>
  req.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ===
  "application/json";

export const authenticateReviewerApiRequest = async (
  req: NextRequest,
): Promise<ReviewerApiAuthResult> => {
  if (!isAdminReviewerPortalEnabled()) {
    return {
      ok: false,
      response: reviewerApiJson({ error: "Not found" }, { status: 404 }),
    };
  }

  const user = await authenticateAdminRequest(req.headers);

  if (!user) {
    return {
      ok: false,
      response: reviewerApiJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!canReviewApps(user)) {
    return {
      ok: false,
      response: reviewerApiJson({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!isOriginSameAsEffectiveHost(req)) {
    return {
      ok: false,
      response: reviewerApiJson(
        { error: "Cross-origin request rejected" },
        { status: 403 },
      ),
    };
  }

  if (!isJsonRequest(req)) {
    return {
      ok: false,
      response: reviewerApiJson(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      ),
    };
  }

  return { ok: true, user };
};

export const authenticateReviewerReadApiRequest = async (
  req: NextRequest,
): Promise<ReviewerApiAuthResult> => {
  if (!isAdminReviewerPortalEnabled()) {
    return {
      ok: false,
      response: reviewerApiJson({ error: "Not found" }, { status: 404 }),
    };
  }

  const user = await authenticateAdminRequest(req.headers);
  if (!user) {
    return {
      ok: false,
      response: reviewerApiJson({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user };
};
