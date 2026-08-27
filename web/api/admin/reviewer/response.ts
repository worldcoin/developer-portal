import type { ReviewerWorkflowSubmission } from "@/api/helpers/reviewer-workflow";
import { NextResponse } from "next/server";

export const reviewerApiJson = (body: unknown, init?: { status?: number }) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export const sanitizedWorkflowError = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : "UnknownError",
});

export const invalidReviewIdResponse = () =>
  reviewerApiJson({ error: "Invalid review id" }, { status: 400 });

export const invalidBodyResponse = () =>
  reviewerApiJson({ error: "Invalid request body" }, { status: 400 });

export const workflowConflictResponse = () =>
  reviewerApiJson(
    { code: "REVIEW_CONFLICT", error: "Review workflow conflict" },
    { status: 409 },
  );

export const workflowSuccessResponse = (
  submission: ReviewerWorkflowSubmission,
) => reviewerApiJson({ submission });
