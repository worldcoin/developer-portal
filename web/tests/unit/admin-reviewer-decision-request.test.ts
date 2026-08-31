import {
  readChecklistWriteBody,
  readDecisionWriteBody,
} from "@/api/admin/reviewer/request-schema";
import { NextRequest } from "next/server";

const CLAIM_TOKEN = "22222222-2222-4222-8222-222222222222";

const request = (body: unknown) =>
  new NextRequest("https://review.example.com/api/admin/reviewer/decision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = {
  claimToken: CLAIM_TOKEN,
  expectedReviewVersion: 7,
  appMetadataId: "meta_123",
  expectedMetadataUpdatedAt: "2026-08-27T12:00:00.123Z",
  decision: "changes_requested",
  developerMessage: "Please correct the listing copy.",
};

const validChecklistBody = {
  claimToken: CLAIM_TOKEN,
  expectedReviewVersion: 7,
  checklistVersion: "2026-08-31.1",
  checklist: {
    internalNotes: "",
    items: [
      {
        id: "group.listing-localization",
        status: "na",
        evidence: "",
      },
    ],
  },
};

describe("review decision request parsing", () => {
  it("accepts the exact versioned decision contract", async () => {
    await expect(readDecisionWriteBody(request(validBody))).resolves.toEqual(
      validBody,
    );
  });

  it("accepts an approval with an optional override reason", async () => {
    const body = {
      ...validBody,
      decision: "approved",
      developerMessage: "",
      overrideReason: "Reviewed manually because one check is incomplete.",
    };

    await expect(readDecisionWriteBody(request(body))).resolves.toEqual(body);
  });

  it("accepts note-free N/A checklist items for version-aware validation", async () => {
    await expect(
      readChecklistWriteBody(request(validChecklistBody)),
    ).resolves.toEqual(validChecklistBody);
  });

  it.each([
    ["reviewer identity", { reviewerEmail: "forged@example.com" }],
    ["publication flags", { isReviewerWorldAppApproved: true }],
    ["unknown fields", { unexpected: true }],
  ])("rejects client-supplied %s", async (_label, extra) => {
    await expect(
      readDecisionWriteBody(request({ ...validBody, ...extra })),
    ).resolves.toBeNull();
  });

  it.each([
    ["missing developer rationale", { developerMessage: "   " }],
    ["invalid decision", { decision: "rejected" }],
    ["invalid metadata timestamp", { expectedMetadataUpdatedAt: "tomorrow" }],
    ["invalid metadata id", { appMetadataId: "  " }],
    ["invalid version", { expectedReviewVersion: 2_147_483_648 }],
  ])("rejects %s", async (_label, replacement) => {
    await expect(
      readDecisionWriteBody(request({ ...validBody, ...replacement })),
    ).resolves.toBeNull();
  });
});
