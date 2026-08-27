import { isUuid } from "@/api/admin/reviewer/request-schema";
import { reviewerApiJson } from "@/api/admin/reviewer/response";
import { logger } from "@/lib/logger";
import { fetchReviewerSubmission } from "@/scenes/Admin/reviewer/server/fetch-reviewer-data";
import { signReviewerSubmissionAssets } from "@/scenes/Admin/reviewer/server/sign-reviewer-assets";
import { NextRequest } from "next/server";

import { authenticateReviewerReadApiRequest } from "../../../auth";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const auth = await authenticateReviewerReadApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return reviewerApiJson({ error: "Invalid review id" }, { status: 400 });
  }

  const submission = await fetchReviewerSubmission(id);
  if (!submission) {
    return reviewerApiJson({ error: "Review not found" }, { status: 404 });
  }

  try {
    const assets = await signReviewerSubmissionAssets({
      appId: submission.appId,
      metadataSnapshot: submission.metadataSnapshot,
      localizationsSnapshot: submission.localizationsSnapshot,
    });
    return reviewerApiJson({ assets });
  } catch (error) {
    logger.error("Failed to sign reviewer submission assets", {
      reviewId: id,
      appId: submission.appId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return reviewerApiJson(
      { error: "Asset previews are temporarily unavailable" },
      { status: 503 },
    );
  }
};
