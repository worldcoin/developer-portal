import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const ClaimReviewSubmission = jest.fn();
const HeartbeatReviewSubmission = jest.fn();
const ReleaseReviewSubmission = jest.fn();
const SaveReviewChecklist = jest.fn();
const FetchReviewChecklistContext = jest.fn();
const loggerError = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
  canReviewApps: (user: { accessLevel: string }) =>
    user.accessLevel === "review",
  isAdminReviewerPortalEnabled: () =>
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED === "true",
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "../../../api/admin/reviewer/graphql/reviewer-workflow.generated",
  () => ({
    getSdk: () => ({
      ClaimReviewSubmission,
      HeartbeatReviewSubmission,
      ReleaseReviewSubmission,
      SaveReviewChecklist,
      FetchReviewChecklistContext,
    }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));
// #endregion

import { POST as claim } from "@/api/admin/reviewer/submissions/[id]/claim";
import { POST as heartbeat } from "@/api/admin/reviewer/submissions/[id]/heartbeat";
import { POST as release } from "@/api/admin/reviewer/submissions/[id]/release";
import { PUT as saveChecklist } from "@/api/admin/reviewer/submissions/[id]/checklist";

// #region Test Data
const REVIEW_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_TOKEN = "22222222-2222-4222-8222-222222222222";
const ADMIN = {
  accessLevel: "review",
  email: "reviewer@example.com",
  role: "internal_dashboard_readonly",
  subject: "reviewer-subject",
};

type Handler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => Promise<Response>;

const createRequest = (
  path: string,
  method: "POST" | "PUT",
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new NextRequest(`https://review.example.com${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      host: "review.example.com",
      origin: "https://review.example.com",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const context = (id = REVIEW_ID) => ({ params: Promise.resolve({ id }) });

const invoke = (
  handler: Handler,
  action: string,
  method: "POST" | "PUT",
  body: unknown,
  headers?: Record<string, string>,
  id?: string,
) =>
  handler(
    createRequest(
      `/api/admin/reviewer/submissions/${id ?? REVIEW_ID}/${action}`,
      method,
      body,
      headers,
    ),
    context(id),
  );

const workflowRow = (overrides: Record<string, unknown> = {}) => ({
  id: REVIEW_ID,
  status: "in_review",
  review_version: 8,
  claim_token: CLAIM_TOKEN,
  claim_expires_at: "2026-08-27T12:30:00.000Z",
  checklist_version: null,
  checklist: {},
  ...overrides,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
  delete process.env.INTERNAL_DASHBOARD_HOST;
  authenticateAdminRequest.mockResolvedValue(ADMIN);
  ClaimReviewSubmission.mockResolvedValue({
    reviewer_claim_app_review_submission: [workflowRow()],
  });
  HeartbeatReviewSubmission.mockResolvedValue({
    reviewer_heartbeat_app_review_submission: [workflowRow()],
  });
  ReleaseReviewSubmission.mockResolvedValue({
    reviewer_release_app_review_submission: [
      workflowRow({
        status: "pending",
        claim_token: null,
        claim_expires_at: null,
      }),
    ],
  });
  SaveReviewChecklist.mockResolvedValue({
    reviewer_save_app_review_checklist: [
      workflowRow({
        checklist_version: "2026-08-27.1",
        checklist: {
          items: [
            {
              id: "shared.privacy-legal",
              status: "pass",
              evidence: "Privacy policy is linked.",
            },
          ],
          internalNotes: "Checked the current draft.",
        },
      }),
    ],
  });
  FetchReviewChecklistContext.mockResolvedValue({
    app_review_submission_by_pk: {
      id: REVIEW_ID,
      app_mode: "mini-app",
      checklist_version: null,
    },
  });
});

// #region Shared admin write boundary
describe("reviewer workflow admin write boundary", () => {
  it("returns 404 while the staging feature is disabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(404);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("returns 401 for an unauthenticated request", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(401);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("returns 403 for a read-only administrator", async () => {
    authenticateAdminRequest.mockResolvedValue({
      ...ADMIN,
      accessLevel: "read",
    });

    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(403);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request against the effective forwarded host", async () => {
    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      {
        host: "proxy.internal",
        "x-forwarded-host": "review.example.com, proxy.internal",
        origin: "https://attacker.example",
      },
    );

    expect(response.status).toBe(403);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("rejects the same host when the Origin scheme differs", async () => {
    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      { origin: "http://review.example.com" },
    );

    expect(response.status).toBe(403);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("uses the parsed request origin for local fallback, not forwarded headers", async () => {
    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      {
        host: "proxy.internal",
        "x-forwarded-host": "attacker.example, proxy.internal",
        "x-forwarded-proto": "http, https",
      },
    );

    expect(response.status).toBe(200);
  });

  it("uses the configured HTTPS dashboard origin despite TLS termination headers", async () => {
    process.env.INTERNAL_DASHBOARD_HOST = "review.example.com";

    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      {
        host: "proxy.internal",
        "x-forwarded-host": "attacker.example, proxy.internal",
        "x-forwarded-proto": "http, https",
        origin: "https://review.example.com",
      },
    );

    expect(response.status).toBe(200);
  });

  it("does not let forwarded values authorize another Origin", async () => {
    process.env.INTERNAL_DASHBOARD_HOST = "review.example.com";

    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      {
        "x-forwarded-host": "attacker.example, review.example.com",
        "x-forwarded-proto": "https, http",
        origin: "https://attacker.example",
      },
    );

    expect(response.status).toBe(403);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("normalizes the configured default HTTPS port but rejects a nondefault port", async () => {
    process.env.INTERNAL_DASHBOARD_HOST = "review.example.com:443";

    const defaultPort = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });
    const nondefaultPort = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      { origin: "https://review.example.com:8443" },
    );

    expect(defaultPort.status).toBe(200);
    expect(nondefaultPort.status).toBe(403);
  });

  it("requires an application/json media type", async () => {
    const response = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      { "content-type": "text/plain" },
    );

    expect(response.status).toBe(415);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });
});
// #endregion

// #region POST claim
describe("POST /api/admin/reviewer/submissions/[id]/claim", () => {
  it("claims with server-derived identity and returns the database token", async () => {
    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      submission: {
        id: REVIEW_ID,
        status: "in_review",
        reviewVersion: 8,
        claimToken: CLAIM_TOKEN,
        claimExpiresAt: "2026-08-27T12:30:00.000Z",
        checklistVersion: null,
        checklist: {},
      },
    });
    expect(ClaimReviewSubmission).toHaveBeenCalledWith({
      submission_id: REVIEW_ID,
      expected_review_version: 7,
      actor_subject: ADMIN.subject,
      actor_email: ADMIN.email,
    });
  });

  it("accepts the maximum GraphQL Int review version", async () => {
    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 2_147_483_647,
    });

    expect(response.status).toBe(200);
    expect(ClaimReviewSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ expected_review_version: 2_147_483_647 }),
    );
  });

  it("rejects a review version above the GraphQL Int range", async () => {
    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 2_147_483_648,
    });

    expect(response.status).toBe(400);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("rejects an invalid review id and unknown or invalid body fields", async () => {
    const invalidId = await invoke(
      claim,
      "claim",
      "POST",
      { expectedReviewVersion: 7 },
      undefined,
      "not-a-uuid",
    );
    const unknownIdentity = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
      actorEmail: "forged@example.com",
    });
    const invalidVersion = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 0,
    });

    expect(invalidId.status).toBe(400);
    expect(unknownIdentity.status).toBe(400);
    expect(invalidVersion.status).toBe(400);
    expect(ClaimReviewSubmission).not.toHaveBeenCalled();
  });

  it("returns 409 when the claim is held, terminal, expired during CAS, or stale", async () => {
    ClaimReviewSubmission.mockResolvedValue({
      reviewer_claim_app_review_submission: [],
    });

    const response = await invoke(claim, "claim", "POST", {
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "REVIEW_CONFLICT",
      error: "Review workflow conflict",
    });
  });
});
// #endregion

// #region Claimed writes
describe.each([
  ["heartbeat", heartbeat, HeartbeatReviewSubmission],
  ["release", release, ReleaseReviewSubmission],
] as const)("POST %s", (action, handler, operation) => {
  it("requires the opaque claim token and expected version", async () => {
    const response = await invoke(handler, action, "POST", {
      claimToken: CLAIM_TOKEN,
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(200);
    expect(operation).toHaveBeenCalledWith({
      submission_id: REVIEW_ID,
      claim_token: CLAIM_TOKEN,
      expected_review_version: 7,
      actor_subject: ADMIN.subject,
      actor_email: ADMIN.email,
    });
  });

  it("returns 400 for malformed tokens, versions, JSON, or unknown fields", async () => {
    const malformedToken = await invoke(handler, action, "POST", {
      claimToken: "caller-token",
      expectedReviewVersion: 7,
    });
    const malformedJson = await invoke(handler, action, "POST", "{");
    const unknownField = await invoke(handler, action, "POST", {
      claimToken: CLAIM_TOKEN,
      expectedReviewVersion: 7,
      publicationApproved: true,
    });

    expect(malformedToken.status).toBe(400);
    expect(malformedJson.status).toBe(400);
    expect(unknownField.status).toBe(400);
    expect(operation).not.toHaveBeenCalled();
  });

  it("returns 409 for lost, expired, terminal, or stale claims", async () => {
    operation.mockResolvedValueOnce({
      [action === "heartbeat"
        ? "reviewer_heartbeat_app_review_submission"
        : "reviewer_release_app_review_submission"]: [],
    });

    const response = await invoke(handler, action, "POST", {
      claimToken: CLAIM_TOKEN,
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(409);
  });

  it("does not log a claim token retained by a GraphQL error", async () => {
    operation.mockRejectedValueOnce(
      Object.assign(new Error("request failed"), {
        request: { variables: { claim_token: CLAIM_TOKEN } },
      }),
    );

    const response = await invoke(handler, action, "POST", {
      claimToken: CLAIM_TOKEN,
      expectedReviewVersion: 7,
    });

    expect(response.status).toBe(500);
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(CLAIM_TOKEN);
  });
});
// #endregion

// #region PUT checklist
describe("PUT /api/admin/reviewer/submissions/[id]/checklist", () => {
  const checklistBody = {
    claimToken: CLAIM_TOKEN,
    expectedReviewVersion: 7,
    checklistVersion: "2026-08-27.1",
    checklist: {
      items: [
        {
          id: "shared.privacy-legal",
          status: "pass",
          evidence: "Privacy policy is linked.",
        },
        {
          id: "mini.smart-contracts",
          status: "na",
          evidence: "No payment flow exists.",
          applicabilityNote: "The app has no purchasable content.",
        },
      ],
      internalNotes: "Checked the current draft.",
    },
  };

  it("saves versioned item results, evidence, applicability, and internal notes", async () => {
    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
    );

    expect(response.status).toBe(200);
    expect(FetchReviewChecklistContext).toHaveBeenCalledWith({
      submission_id: REVIEW_ID,
    });
    expect(SaveReviewChecklist).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_id: REVIEW_ID,
        claim_token: CLAIM_TOKEN,
        expected_review_version: 7,
        checklist_version: "2026-08-27.1",
        checklist: {
          ...checklistBody.checklist,
          definitionSnapshot: {
            mode: "mini-app",
            items: expect.arrayContaining([
              expect.objectContaining({
                id: "shared.metadata-accurate",
                label: "Accurate metadata",
                description: expect.any(String),
                sourceUrl: "https://docs.world.org/mini-apps/guidelines/policy",
                conditional: false,
              }),
              expect.objectContaining({
                id: "mini.smart-contracts",
                label: "Smart contracts",
                description: expect.any(String),
                sourceUrl: "https://docs.world.org/mini-apps/guidelines/policy",
                conditional: true,
              }),
            ]),
          },
        },
        actor_subject: ADMIN.subject,
        actor_email: ADMIN.email,
      }),
    );
  });

  it("rejects unknown checklist versions before the mutation", async () => {
    const response = await invoke(saveChecklist, "checklist", "PUT", {
      ...checklistBody,
      checklistVersion: "retired-version",
    });

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("rejects item IDs from another app mode", async () => {
    FetchReviewChecklistContext.mockResolvedValueOnce({
      app_review_submission_by_pk: {
        id: REVIEW_ID,
        app_mode: "external",
        checklist_version: null,
      },
    });

    const response = await invoke(saveChecklist, "checklist", "PUT", {
      ...checklistBody,
      checklist: {
        items: [
          {
            id: "mini.mobile-reliability",
            status: "pass",
            evidence: "Tested in World App.",
          },
        ],
        internalNotes: "",
      },
    });

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("fails closed when the stored checklist version is unsupported", async () => {
    FetchReviewChecklistContext.mockResolvedValueOnce({
      app_review_submission_by_pk: {
        id: REVIEW_ID,
        app_mode: "mini-app",
        checklist_version: "retired-version",
      },
    });

    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
    );

    expect(response.status).toBe(409);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("returns a conflict when the server cannot resolve the review context", async () => {
    FetchReviewChecklistContext.mockResolvedValueOnce({
      app_review_submission_by_pk: null,
    });

    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
    );

    expect(response.status).toBe(409);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it.each([
    [
      "malformed status",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          items: [
            {
              id: "shared.privacy-legal",
              status: "passed",
              evidence: "ok",
            },
          ],
        },
      },
    ],
    [
      "N/A without applicability note",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          items: [
            {
              id: "mini.smart-contracts",
              status: "na",
              evidence: "none",
            },
          ],
        },
      },
    ],
    [
      "unknown nested field",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          items: [
            {
              id: "shared.privacy-legal",
              status: "pass",
              evidence: "ok",
              reviewerEmail: "forged@example.com",
            },
          ],
        },
      },
    ],
    [
      "unknown top-level field",
      { ...checklistBody, isReviewerWorldAppApproved: true },
    ],
    [
      "client-supplied definition snapshot",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          definitionSnapshot: { mode: "mini-app", items: [] },
        },
      },
    ],
    [
      "duplicate stable item IDs",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          items: [
            checklistBody.checklist.items[0],
            checklistBody.checklist.items[0],
          ],
        },
      },
    ],
  ])("returns 400 for %s", async (_label, body) => {
    const response = await invoke(saveChecklist, "checklist", "PUT", body);

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("returns 409 for a lost, expired, terminal, or stale claim", async () => {
    SaveReviewChecklist.mockResolvedValue({
      reviewer_save_app_review_checklist: [],
    });

    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
    );

    expect(response.status).toBe(409);
  });

  it("rejects more than 200 checklist items", async () => {
    const response = await invoke(saveChecklist, "checklist", "PUT", {
      ...checklistBody,
      checklist: {
        ...checklistBody.checklist,
        items: Array.from({ length: 201 }, (_, index) => ({
          id: `item-${index}`,
          status: "pass",
          evidence: "ok",
        })),
      },
    });

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("rejects an actual UTF-8 JSON body larger than 256 KiB", async () => {
    const request = createRequest(
      `/api/admin/reviewer/submissions/${REVIEW_ID}/checklist`,
      "PUT",
      {
        ...checklistBody,
        checklist: {
          ...checklistBody.checklist,
          items: Array.from({ length: 27 }, (_, index) => ({
            id: `item-${index}`,
            status: "pass",
            evidence: "é".repeat(5_000),
          })),
        },
      },
    );
    request.headers.delete("content-length");

    expect(request.headers.get("content-length")).toBeNull();

    const response = await saveChecklist(request, context());

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared Content-Length before mutation", async () => {
    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
      { "content-length": String(256 * 1024 + 1) },
    );

    expect(response.status).toBe(400);
    expect(SaveReviewChecklist).not.toHaveBeenCalled();
  });

  it("does not log a checklist claim token retained by a GraphQL error", async () => {
    SaveReviewChecklist.mockRejectedValueOnce(
      Object.assign(new Error("request failed"), {
        request: { variables: { claim_token: CLAIM_TOKEN } },
      }),
    );

    const response = await invoke(
      saveChecklist,
      "checklist",
      "PUT",
      checklistBody,
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(CLAIM_TOKEN);
  });
});
// #endregion
