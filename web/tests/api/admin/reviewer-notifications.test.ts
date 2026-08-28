import { NextRequest } from "next/server";

const claimReviewNotifications = jest.fn();
const fetchReviewNotificationContext = jest.fn();
const completeReviewNotification = jest.fn();
const retryReviewNotification = jest.fn();
const reconcileRetryReviewNotification = jest.fn();
const deliverReviewNotification = jest.fn();
const authenticateAdminRequest = jest.fn();
const repairReviewerAssetSnapshots = jest.fn();
const settleLegacyVerificationAssets = jest.fn();

jest.mock("@/api/helpers/reviewer-notifications", () => ({
  claimReviewNotifications: (...args: unknown[]) =>
    claimReviewNotifications(...args),
  fetchReviewNotificationContext: (...args: unknown[]) =>
    fetchReviewNotificationContext(...args),
  completeReviewNotification: (...args: unknown[]) =>
    completeReviewNotification(...args),
  retryReviewNotification: (...args: unknown[]) =>
    retryReviewNotification(...args),
  reconcileRetryReviewNotification: (...args: unknown[]) =>
    reconcileRetryReviewNotification(...args),
}));

jest.mock("@/api/helpers/reviewer-notification-delivery", () => ({
  deliverReviewNotification: (...args: unknown[]) =>
    deliverReviewNotification(...args),
}));

jest.mock(
  "@/api/helpers/reviewer-asset-snapshot-repair",
  () => ({
    repairReviewerAssetSnapshots: (...args: unknown[]) =>
      repairReviewerAssetSnapshots(...args),
  }),
  { virtual: true },
);

jest.mock(
  "@/api/helpers/legacy-verification-asset-settlement",
  () => ({
    settleLegacyVerificationAssets: (...args: unknown[]) =>
      settleLegacyVerificationAssets(...args),
  }),
  { virtual: true },
);

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
  canReviewApps: (user: { accessLevel: string }) =>
    user.accessLevel === "review",
  isAdminReviewerPortalEnabled: () =>
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED === "true",
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST as deliverNotifications } from "@/api/_deliver-review-notifications";
import { POST as retryNotification } from "@/api/admin/reviewer/notifications/[id]/retry";

const REVIEW_ID = "11111111-1111-4111-8111-111111111111";
const NOTIFICATION_ONE = "22222222-2222-4222-8222-222222222222";
const NOTIFICATION_TWO = "33333333-3333-4333-8333-333333333333";
const RETRY_OPERATION_ID = "44444444-4444-4444-8444-444444444444";
const ADMIN = {
  accessLevel: "review",
  email: "reviewer@example.com",
  role: "internal_dashboard_readonly",
  subject: "reviewer-subject",
};

const claimed = (id: string) => ({
  id,
  submissionId: REVIEW_ID,
  notificationType: "submission_received",
  channel: "slack",
  status: "processing",
  recipient: null,
  payload: {},
  attemptCount: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "true";
  authenticateAdminRequest.mockResolvedValue(ADMIN);
  claimReviewNotifications.mockResolvedValue([claimed(NOTIFICATION_ONE)]);
  fetchReviewNotificationContext.mockImplementation(async (id: string) => ({
    notification: {
      ...claimed(id),
      lockedAt: new Date().toISOString(),
      lockedBy: claimReviewNotifications.mock.calls[0]?.[0]?.workerId,
    },
    submission: { id: REVIEW_ID },
  }));
  deliverReviewNotification.mockResolvedValue({
    outcome: "delivered",
    providerMessageId: "provider-1",
  });
  completeReviewNotification.mockResolvedValue({
    id: NOTIFICATION_ONE,
    status: "delivered",
  });
  retryReviewNotification.mockResolvedValue({
    id: NOTIFICATION_ONE,
    status: "pending",
    attemptCount: 2,
  });
  reconcileRetryReviewNotification.mockResolvedValue(null);
  repairReviewerAssetSnapshots.mockResolvedValue({
    attempted: 1,
    repaired: 1,
    failed: 0,
  });
  settleLegacyVerificationAssets.mockResolvedValue({
    claimed: 1,
    delivered: 1,
    failed: 0,
    finalizationPending: 0,
  });
});

const workerRequest = (authorization = "Bearer internal-secret") =>
  new NextRequest("https://portal.example.com/_deliver-review-notifications", {
    method: "POST",
    headers: { authorization },
  });

describe("review notification worker endpoint", () => {
  it("rejects a scheduler request without the internal secret", async () => {
    const response = await deliverNotifications(workerRequest("Bearer bad"));

    expect(response.status).toBe(403);
    expect(claimReviewNotifications).not.toHaveBeenCalled();
  });

  it("continues draining while the reviewer UI feature is disabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const response = await deliverNotifications(workerRequest());

    expect(response.status).toBe(200);
    expect(claimReviewNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it("finalizes a successful provider delivery with its provider id", async () => {
    const response = await deliverNotifications(workerRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ claimed: 1, delivered: 1, failed: 0 }),
    );
    expect(completeReviewNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: NOTIFICATION_ONE,
        outcome: "delivered",
        providerMessageId: "provider-1",
      }),
    );
  });

  it("repairs legacy NULL asset manifests before the reviewer UI is enabled", async () => {
    process.env.ADMIN_REVIEWER_PORTAL_ENABLED = "false";

    const response = await deliverNotifications(workerRequest());

    expect(repairReviewerAssetSnapshots).toHaveBeenCalledWith({ limit: 10 });
    expect(settleLegacyVerificationAssets).toHaveBeenCalledWith({
      workerId: expect.stringMatching(/^review-outbox-/),
      limit: 10,
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        assetSnapshots: { attempted: 1, repaired: 1, failed: 0 },
        legacyVerificationAssets: {
          claimed: 1,
          delivered: 1,
          failed: 0,
          finalizationPending: 0,
        },
      }),
    );
  });

  it("records a bounded provider failure without exposing the raw provider body", async () => {
    deliverReviewNotification.mockRejectedValue(
      new Error(`Slack delivery failed: ${"secret-response".repeat(500)}`),
    );
    completeReviewNotification.mockResolvedValue({
      id: NOTIFICATION_ONE,
      status: "failed",
    });

    const response = await deliverNotifications(workerRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({ claimed: 1, delivered: 0, failed: 1 }),
    );
    const completion = completeReviewNotification.mock.calls[0][0];
    expect(completion.outcome).toBe("failed");
    expect(completion.error).toBe("Review notification delivery failed.");
    expect(JSON.stringify(body)).not.toContain("secret-response");
  });

  it("isolates one failed item from the rest of the claimed batch", async () => {
    claimReviewNotifications.mockResolvedValue([
      claimed(NOTIFICATION_ONE),
      claimed(NOTIFICATION_TWO),
    ]);
    deliverReviewNotification
      .mockRejectedValueOnce(new Error("provider failed"))
      .mockResolvedValueOnce({
        outcome: "delivered",
        providerMessageId: "provider-2",
      });
    completeReviewNotification.mockImplementation(
      async ({ notificationId, outcome }: Record<string, string>) => ({
        id: notificationId,
        status: outcome === "delivered" ? "delivered" : "failed",
      }),
    );

    const response = await deliverNotifications(workerRequest());

    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ claimed: 2, delivered: 1, failed: 1 }),
    );
    expect(deliverReviewNotification).toHaveBeenCalledTimes(2);
  });

  it("never failure-finalizes after the provider succeeded but completion stayed ambiguous", async () => {
    completeReviewNotification.mockRejectedValue(new Error("Hasura timeout"));

    const response = await deliverNotifications(workerRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        claimed: 1,
        delivered: 0,
        failed: 0,
        finalizationPending: 1,
      }),
    );
    expect(completeReviewNotification).toHaveBeenCalledTimes(3);
    expect(
      completeReviewNotification.mock.calls.every(
        ([input]) => input.outcome === "delivered",
      ),
    ).toBe(true);
  });

  it("does not call a provider after the notification lease moved to another worker", async () => {
    fetchReviewNotificationContext.mockResolvedValue({
      notification: {
        ...claimed(NOTIFICATION_ONE),
        lockedBy: "another-worker",
      },
      submission: { id: REVIEW_ID },
    });
    completeReviewNotification.mockResolvedValue(null);

    const response = await deliverNotifications(workerRequest());

    expect(response.status).toBe(200);
    expect(deliverReviewNotification).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ finalizationPending: 1 }),
    );
  });

  it("does not call a provider when too little claim lease remains", async () => {
    fetchReviewNotificationContext.mockImplementation(async (id: string) => ({
      notification: {
        ...claimed(id),
        lockedAt: new Date(Date.now() - 4 * 60_000 - 1).toISOString(),
        lockedBy: claimReviewNotifications.mock.calls[0]?.[0]?.workerId,
      },
      submission: { id: REVIEW_ID },
    }));

    const response = await deliverNotifications(workerRequest());

    expect(response.status).toBe(200);
    expect(deliverReviewNotification).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ finalizationPending: 1 }),
    );
  });
});

const retryRequest = (
  headers: Record<string, string> = {},
  body: unknown = { operationId: RETRY_OPERATION_ID },
) =>
  new NextRequest(
    `https://review.example.com/api/admin/reviewer/notifications/${NOTIFICATION_ONE}/retry`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "review.example.com",
        origin: "https://review.example.com",
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );

describe("manual review notification retry", () => {
  it("requires reviewer access and derives the actor from the session", async () => {
    const response = await retryNotification(retryRequest(), {
      params: Promise.resolve({ id: NOTIFICATION_ONE }),
    });

    expect(response.status).toBe(200);
    expect(retryReviewNotification).toHaveBeenCalledWith({
      notificationId: NOTIFICATION_ONE,
      operationId: RETRY_OPERATION_ID,
      actor: ADMIN,
    });
  });

  it("returns a conflict when the notification is not failed", async () => {
    retryReviewNotification.mockResolvedValue(null);

    const response = await retryNotification(retryRequest(), {
      params: Promise.resolve({ id: NOTIFICATION_ONE }),
    });

    expect(response.status).toBe(409);
  });

  it("returns a committed retry when the mutation response is lost", async () => {
    retryReviewNotification.mockRejectedValueOnce(
      new Error("connection reset"),
    );
    reconcileRetryReviewNotification.mockResolvedValueOnce({
      id: NOTIFICATION_ONE,
      status: "pending",
      attemptCount: 2,
    });

    const response = await retryNotification(retryRequest(), {
      params: Promise.resolve({ id: NOTIFICATION_ONE }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notification: expect.objectContaining({
        id: NOTIFICATION_ONE,
        status: "pending",
      }),
    });
    expect(reconcileRetryReviewNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: NOTIFICATION_ONE,
        operationId: expect.any(String),
        actor: ADMIN,
      }),
    );
    expect(reconcileRetryReviewNotification.mock.calls[0][0].operationId).toBe(
      retryReviewNotification.mock.calls[0][0].operationId,
    );
  });

  it("rejects read-only, cross-origin, malformed-id, and malformed requests", async () => {
    authenticateAdminRequest.mockResolvedValue({
      ...ADMIN,
      accessLevel: "read",
    });
    expect(
      (
        await retryNotification(retryRequest(), {
          params: Promise.resolve({ id: NOTIFICATION_ONE }),
        })
      ).status,
    ).toBe(403);

    authenticateAdminRequest.mockResolvedValue(ADMIN);
    expect(
      (
        await retryNotification(
          retryRequest({ origin: "https://attacker.example" }),
          { params: Promise.resolve({ id: NOTIFICATION_ONE }) },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await retryNotification(retryRequest(), {
          params: Promise.resolve({ id: "bad" }),
        })
      ).status,
    ).toBe(400);

    expect(
      (
        await retryNotification(retryRequest({}, { actor: "spoofed" }), {
          params: Promise.resolve({ id: NOTIFICATION_ONE }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await retryNotification(
          retryRequest({}, { operationId: "not-a-uuid" }),
          { params: Promise.resolve({ id: NOTIFICATION_ONE }) },
        )
      ).status,
    ).toBe(400);
  });
});
