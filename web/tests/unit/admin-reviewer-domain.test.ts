import {
  REVIEW_CHECKLIST_VERSION,
  getChecklistDefinitions,
  isReviewChecklistVersionSupported,
  validateApprovalChecklist,
  validateChecklistDraft,
} from "@/scenes/Admin/reviewer/checklist";
import {
  applyReviewerQueueFilters,
  createReviewerQueueWhere,
  parseReviewerQueueFilters,
} from "@/scenes/Admin/reviewer/queue-filters";
import {
  buildMiniAppDraftUrl,
  getSafeExternalIntegrationUrl,
} from "@/scenes/Admin/reviewer/preview-links";
import { sortReviewEvents } from "@/scenes/Admin/reviewer/history";
import { buildReviewerSnapshotDiff } from "@/scenes/Admin/reviewer/metadata-diff";
import type { ReviewerSubmissionStatus } from "@/scenes/Admin/reviewer/types";

const submission = (
  overrides: Partial<{
    id: string;
    status: ReviewerSubmissionStatus;
    appMode: "mini-app" | "external";
    teamId: string;
    teamName: string;
    submittedAt: string;
    claimedByEmail: string | null;
    claimExpiresAt: string | null;
  }> = {},
) => ({
  id: overrides.id ?? "review-default",
  status: overrides.status ?? "pending",
  appMode: overrides.appMode ?? ("mini-app" as const),
  teamId: overrides.teamId ?? "team-default",
  teamName: overrides.teamName ?? "Default team",
  submittedAt: overrides.submittedAt ?? "2026-08-20T12:00:00.000Z",
  claimedByEmail: overrides.claimedByEmail ?? null,
  claimExpiresAt: overrides.claimExpiresAt ?? null,
});

describe("reviewer queue filters", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");
  const rows = [
    submission({
      id: "newer",
      submittedAt: "2026-08-26T12:00:00.000Z",
      teamId: "team-2",
      teamName: "Beta",
    }),
    submission({
      id: "oldest",
      submittedAt: "2026-08-18T12:00:00.000Z",
      teamId: "team-1",
      teamName: "Alpha",
    }),
    submission({
      id: "mine",
      status: "in_review",
      appMode: "external",
      submittedAt: "2026-08-19T12:00:00.000Z",
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2026-08-28T12:00:00.000Z",
      teamId: "team-1",
      teamName: "Alpha",
    }),
    submission({
      id: "expired",
      status: "in_review",
      submittedAt: "2026-08-17T12:00:00.000Z",
      claimedByEmail: "former@example.com",
      claimExpiresAt: "2026-08-26T12:00:00.000Z",
    }),
  ];

  it("orders the queue oldest first", () => {
    const result = applyReviewerQueueFilters(
      rows,
      parseReviewerQueueFilters({ status: "all" }),
      "reviewer@example.com",
      now,
    );

    expect(result.map(({ id }) => id)).toEqual([
      "expired",
      "oldest",
      "mine",
      "newer",
    ]);
  });

  it("supports Mine, mode, team, age, assignee, and status filters", () => {
    const mine = applyReviewerQueueFilters(
      rows,
      parseReviewerQueueFilters({ status: "mine" }),
      "reviewer@example.com",
      now,
    );
    expect(mine.map(({ id }) => id)).toEqual(["mine"]);

    const available = applyReviewerQueueFilters(
      rows,
      parseReviewerQueueFilters({ status: "pending" }),
      "reviewer@example.com",
      now,
    );
    expect(available.map(({ id }) => id)).toEqual([
      "expired",
      "oldest",
      "newer",
    ]);

    const activelyReviewed = applyReviewerQueueFilters(
      rows,
      parseReviewerQueueFilters({ status: "in_review" }),
      "reviewer@example.com",
      now,
    );
    expect(activelyReviewed.map(({ id }) => id)).toEqual(["mine"]);

    const filtered = applyReviewerQueueFilters(
      rows,
      parseReviewerQueueFilters({
        age: "over-7d",
        assignee: "reviewer@example.com",
        mode: "external",
        status: "in_review",
        team: "alpha",
      }),
      "someone-else@example.com",
      now,
    );
    expect(filtered.map(({ id }) => id)).toEqual(["mine"]);
  });

  it("pushes queue views and text filters into the paginated database query", () => {
    const filters = parseReviewerQueueFilters({
      age: "over-7d",
      assignee: "reviewer@example.com",
      mode: "external",
      page: "3",
      status: "in_review",
      team: "Alpha_100%",
    });

    expect(filters.page).toBe(3);
    expect(
      createReviewerQueueWhere(filters, "viewer@example.com", now),
    ).toEqual({
      _and: [
        {
          _and: [
            { status: { _eq: "in_review" } },
            {
              claim_expires_at: { _gt: "2026-08-27T12:00:00.000Z" },
            },
          ],
        },
        { app_mode: { _eq: "external" } },
        {
          _or: [
            { team_id: { _ilike: "%Alpha\\_100\\%%" } },
            { team: { name: { _ilike: "%Alpha\\_100\\%%" } } },
          ],
        },
        {
          claimed_by_email: { _ilike: "%reviewer@example.com%" },
        },
        {
          submitted_at: { _lte: "2026-08-20T12:00:00.000Z" },
        },
      ],
    });
  });
});

describe("review preview links", () => {
  it("builds the exact submitted Mini App draft URL", () => {
    expect(buildMiniAppDraftUrl("app_123", "metadata_456")).toBe(
      "https://world.org/mini-app?app_id=app_123&path=&draft_id=metadata_456",
    );
  });

  it("allows only HTTPS external integration URLs", () => {
    expect(getSafeExternalIntegrationUrl("https://example.com/app")).toBe(
      "https://example.com/app",
    );
    expect(getSafeExternalIntegrationUrl("http://example.com/app")).toBeNull();
    expect(getSafeExternalIntegrationUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("versioned reviewer checklist", () => {
  it("uses stable shared and mode-specific item IDs", () => {
    const miniAppIds = getChecklistDefinitions("mini-app").map(({ id }) => id);
    const externalIds = getChecklistDefinitions("external").map(({ id }) => id);

    expect(REVIEW_CHECKLIST_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(miniAppIds).toContain("shared.metadata-accurate");
    expect(miniAppIds).toContain("mini.mobile-reliability");
    expect(externalIds).toContain("shared.metadata-accurate");
    expect(externalIds).toContain("external.idkit-flow");
    expect(externalIds).not.toContain("mini.mobile-reliability");
    expect(new Set(miniAppIds).size).toBe(miniAppIds.length);
    expect(new Set(externalIds).size).toBe(externalIds.length);
    expect(isReviewChecklistVersionSupported(REVIEW_CHECKLIST_VERSION)).toBe(
      true,
    );
    expect(isReviewChecklistVersionSupported("retired-version")).toBe(false);
    expect(getChecklistDefinitions("mini-app", "retired-version")).toEqual([]);
  });

  it("requires an applicability note for N/A", () => {
    const errors = validateChecklistDraft("external", {
      internalNotes: "",
      items: [
        {
          id: "shared.metadata-accurate",
          status: "na",
          evidence: "",
          applicabilityNote: "   ",
        },
      ],
    });

    expect(errors).toContain(
      "shared.metadata-accurate requires an applicability note",
    );
  });

  it("requires an override reason for failed or incomplete approval checks", () => {
    const checklist = {
      internalNotes: "",
      items: [
        {
          id: "shared.metadata-accurate",
          status: "fail" as const,
          evidence: "Name does not match the app.",
        },
      ],
    };

    expect(validateApprovalChecklist("mini-app", checklist, "")).toEqual(
      expect.arrayContaining([
        "Override reason is required when checks fail or remain incomplete",
      ]),
    );
    expect(
      validateApprovalChecklist(
        "mini-app",
        checklist,
        "Approved for a time-sensitive partner launch.",
      ),
    ).not.toContain(
      "Override reason is required when checks fail or remain incomplete",
    );
  });

  it("fails closed when a stored checklist version is unknown", () => {
    expect(
      validateApprovalChecklist(
        "mini-app",
        { internalNotes: "", items: [] },
        "Manual override",
        "retired-version",
      ),
    ).toContain("Checklist version retired-version is not supported");
  });
});

describe("review history", () => {
  it("uses the immutable event sequence for deterministic newest-first order", () => {
    const result = sortReviewEvents([
      {
        id: "later-time-lower-sequence",
        eventSequence: 3,
        createdAt: "2026-08-27T13:00:00.000Z",
      },
      {
        id: "higher-sequence",
        eventSequence: 4,
        createdAt: "2026-08-27T12:00:00.000Z",
      },
    ]);

    expect(result.map(({ id }) => id)).toEqual([
      "higher-sequence",
      "later-time-lower-sequence",
    ]);
  });
});

describe("review snapshot differences", () => {
  it("highlights canonical draft metadata and localisation changes from live", () => {
    const differences = buildReviewerSnapshotDiff({
      metadataSnapshot: {
        name: "Draft name",
        supported_languages: ["en", "es"],
      },
      localizationsSnapshot: [{ locale: "es", name: "Nombre borrador" }],
      liveMetadata: {
        name: "Live name",
        supported_languages: ["en"],
      },
      liveLocalizations: [{ locale: "es", name: "Nombre publicado" }],
    });

    expect(differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "name",
          draftValue: "Draft name",
          liveValue: "Live name",
        }),
        expect.objectContaining({ field: "supported_languages" }),
        expect.objectContaining({ field: "localisations.es.name" }),
      ]),
    );
  });

  it("ignores workflow identity and timestamp fields when comparing versions", () => {
    const differences = buildReviewerSnapshotDiff({
      metadataSnapshot: {
        id: "draft-id",
        app_id: "app_1",
        created_at: "2026-08-20T12:00:00.000Z",
        updated_at: "2026-08-21T12:00:00.000Z",
        verification_status: "awaiting_review",
        reviewed_by: "",
        is_reviewer_world_app_approved: false,
        name: "Same listing",
      },
      localizationsSnapshot: [
        {
          id: "draft-localization",
          app_metadata_id: "draft-id",
          locale: "es",
          updated_at: "2026-08-21T12:00:00.000Z",
          name: "Misma ficha",
        },
      ],
      liveMetadata: {
        id: "live-id",
        app_id: "app_1",
        created_at: "2026-07-20T12:00:00.000Z",
        updated_at: "2026-07-21T12:00:00.000Z",
        verification_status: "verified",
        reviewed_by: "reviewer@example.com",
        is_reviewer_world_app_approved: true,
        name: "Same listing",
      },
      liveLocalizations: [
        {
          id: "live-localization",
          app_metadata_id: "live-id",
          locale: "es",
          updated_at: "2026-07-21T12:00:00.000Z",
          name: "Misma ficha",
        },
      ],
    });

    expect(differences).toEqual([]);
  });
});
