"use client";

import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Tabs } from "@/components/Tabs";

import {
  REVIEW_CHECKLIST_VERSION,
  getChecklistProgress,
  isReviewChecklistVersionSupported,
  validateApprovalChecklist,
  validateChecklistDraft,
} from "../checklist";
import type {
  ReviewerSubmissionDetail,
  ReviewerSubmissionStatus,
} from "../types";
import { ReviewClaimBar } from "./ReviewClaimBar";
import {
  clearReviewerClaimSession,
  readReviewerClaimSession,
  shouldHeartbeatReviewerClaim,
  writeReviewerClaimSession,
} from "./claim-session";
import { ReviewGuidelines } from "./ReviewGuidelines";
import { ReviewHistory } from "./ReviewHistory";
import { ReviewMetadata } from "./ReviewMetadata";
import { ReviewOverview } from "./ReviewOverview";
import { ReviewTestPanel } from "./ReviewTestPanel";

const panels = [
  "Overview",
  "Metadata",
  "Test",
  "Guidelines",
  "History",
] as const;
type Panel = (typeof panels)[number];

type WorkflowState = {
  status: ReviewerSubmissionStatus;
  reviewVersion: number;
  claimToken: string | null;
  claimExpiresAt: string | null;
  claimedByEmail: string | null;
};

type WorkflowPayload = {
  submission?: {
    status: string;
    reviewVersion: number;
    claimToken: string | null;
    claimExpiresAt: string | null;
  };
};

const getPersistedChecklistVersion = (submission: ReviewerSubmissionDetail) =>
  submission.checklistVersion && submission.checklist.definitionSnapshot
    ? submission.checklistVersion
    : null;

const claimedWriteBody = (workflow: WorkflowState) => ({
  claimToken: workflow.claimToken,
  expectedReviewVersion: workflow.reviewVersion,
});

export const ReviewerWorkspace = ({
  canReview,
  currentUserEmail,
  submission,
}: {
  canReview: boolean;
  currentUserEmail: string;
  submission: ReviewerSubmissionDetail;
}) => {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<Panel>("Overview");
  const [workflow, setWorkflow] = useState<WorkflowState>({
    status: submission.status,
    reviewVersion: submission.reviewVersion,
    claimToken: null,
    claimExpiresAt: submission.claimExpiresAt,
    claimedByEmail: submission.claimedByEmail,
  });
  const [checklist, setChecklist] = useState<ReviewChecklist>(
    submission.checklist,
  );
  const [persistedChecklistVersion, setPersistedChecklistVersion] = useState<
    string | null
  >(() => getPersistedChecklistVersion(submission));
  const [checklistDirty, setChecklistDirty] = useState(false);
  const [developerMessage, setDeveloperMessage] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const workflowRef = useRef(workflow);
  const heartbeatPromiseRef = useRef<Promise<void> | null>(null);
  const busyActionRef = useRef<string | null>(null);
  const checklistDirtyRef = useRef(false);
  const submissionIdRef = useRef(submission.id);

  const updateBusyAction = useCallback((action: string | null) => {
    busyActionRef.current = action;
    setBusyAction(action);
  }, []);

  const updateChecklistDirty = useCallback((dirty: boolean) => {
    checklistDirtyRef.current = dirty;
    setChecklistDirty(dirty);
  }, []);

  const updateWorkflow = useCallback(
    (update: WorkflowState | ((current: WorkflowState) => WorkflowState)) => {
      const next =
        typeof update === "function" ? update(workflowRef.current) : update;
      workflowRef.current = next;
      setWorkflow(next);
    },
    [],
  );

  useEffect(() => {
    const submissionChanged = submissionIdRef.current !== submission.id;
    submissionIdRef.current = submission.id;
    const next: WorkflowState = {
      status: submission.status,
      reviewVersion: submission.reviewVersion,
      claimToken: null,
      claimExpiresAt: submission.claimExpiresAt,
      claimedByEmail: submission.claimedByEmail,
    };
    workflowRef.current = next;
    setWorkflow(next);
    if (submissionChanged || !checklistDirtyRef.current) {
      setChecklist(submission.checklist);
      setPersistedChecklistVersion(getPersistedChecklistVersion(submission));
      updateChecklistDirty(false);
    }
  }, [submission, updateChecklistDirty]);

  useEffect(() => {
    if (
      !canReview ||
      submission.status !== "in_review" ||
      submission.claimedByEmail?.toLocaleLowerCase() !==
        currentUserEmail.toLocaleLowerCase()
    ) {
      clearReviewerClaimSession(submission.id);
      return;
    }

    const restored = readReviewerClaimSession(
      submission.id,
      submission.reviewVersion,
    );
    if (!restored || restored.claimExpiresAt !== submission.claimExpiresAt) {
      if (restored) clearReviewerClaimSession(submission.id);
      return;
    }
    updateWorkflow((current) => ({
      ...current,
      claimToken: restored.claimToken,
      claimExpiresAt: restored.claimExpiresAt,
      reviewVersion: restored.reviewVersion,
    }));
  }, [canReview, currentUserEmail, submission, updateWorkflow]);

  const applyWorkflowPayload = useCallback(
    (payload: WorkflowPayload, action: string) => {
      if (!payload.submission) return false;
      const next = {
        status: payload.submission!.status as ReviewerSubmissionStatus,
        reviewVersion: payload.submission!.reviewVersion,
        claimToken: payload.submission!.claimToken,
        claimExpiresAt: payload.submission!.claimExpiresAt,
        claimedByEmail:
          action === "release"
            ? null
            : currentUserEmail || workflowRef.current.claimedByEmail,
      };
      if (next.claimToken && next.claimExpiresAt) {
        writeReviewerClaimSession(submission.id, {
          claimToken: next.claimToken,
          claimExpiresAt: next.claimExpiresAt,
          reviewVersion: next.reviewVersion,
        });
      } else {
        clearReviewerClaimSession(submission.id);
      }
      updateWorkflow(next);
      return true;
    },
    [currentUserEmail, submission.id, updateWorkflow],
  );

  const workflowRequest = useCallback(
    async ({
      action,
      body,
      method = "POST",
      path,
      quiet = false,
    }: {
      action: string;
      body: Record<string, unknown>;
      method?: "POST" | "PUT";
      path: string;
      quiet?: boolean;
    }) => {
      if (!quiet) updateBusyAction(action);
      try {
        const response = await fetch(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (response.status === 409) {
          clearReviewerClaimSession(submission.id);
          updateWorkflow((current) => ({ ...current, claimToken: null }));
          toast.error(
            "The claim or review version changed. Reload and reclaim.",
          );
          router.refresh();
          return null;
        }
        if (!response.ok) {
          toast.error("The review action could not be saved.");
          return null;
        }
        return (await response.json()) as WorkflowPayload;
      } catch {
        toast.error("The review action could not be saved.");
        return null;
      } finally {
        if (!quiet) updateBusyAction(null);
      }
    },
    [router, submission.id, updateBusyAction, updateWorkflow],
  );

  const claim = async () => {
    if (busyActionRef.current) return;
    const payload = await workflowRequest({
      action: "claim",
      path: `/api/admin/reviewer/submissions/${submission.id}/claim`,
      body: { expectedReviewVersion: workflowRef.current.reviewVersion },
    });
    if (payload && applyWorkflowPayload(payload, "claim")) {
      toast.success("Review claimed for 30 minutes");
    }
  };

  const claimedWorkflowRequest = useCallback(
    async ({
      action,
      extraBody = {},
      method = "POST",
      path,
    }: {
      action: string;
      extraBody?: Record<string, unknown>;
      method?: "POST" | "PUT";
      path: string;
    }) => {
      if (busyActionRef.current) return null;
      updateBusyAction(action);
      try {
        await heartbeatPromiseRef.current;
        const current = workflowRef.current;
        if (!current.claimToken) return null;
        return await workflowRequest({
          action,
          path,
          method,
          quiet: true,
          body: { ...claimedWriteBody(current), ...extraBody },
        });
      } finally {
        updateBusyAction(null);
      }
    },
    [updateBusyAction, workflowRequest],
  );

  const release = async () => {
    if (!workflowRef.current.claimToken) return;
    const payload = await claimedWorkflowRequest({
      action: "release",
      path: `/api/admin/reviewer/submissions/${submission.id}/release`,
    });
    if (payload && applyWorkflowPayload(payload, "release")) {
      toast.success("Review claim released");
    }
  };

  const workflowRequestRef = useRef(workflowRequest);
  workflowRequestRef.current = workflowRequest;
  const applyWorkflowPayloadRef = useRef(applyWorkflowPayload);
  applyWorkflowPayloadRef.current = applyWorkflowPayload;

  useEffect(() => {
    if (!canReview) return;

    const heartbeat = async () => {
      if (heartbeatPromiseRef.current || busyActionRef.current) return;
      if (
        !shouldHeartbeatReviewerClaim({
          busyAction: busyActionRef.current,
          canReview,
          claimToken: workflowRef.current.claimToken,
          status: workflowRef.current.status,
          visibilityState: document.visibilityState,
        })
      ) {
        return;
      }
      const currentHeartbeat = (async () => {
        const payload = await workflowRequestRef.current({
          action: "heartbeat",
          path: `/api/admin/reviewer/submissions/${submission.id}/heartbeat`,
          body: claimedWriteBody(workflowRef.current),
          quiet: true,
        });
        if (payload) {
          applyWorkflowPayloadRef.current(payload, "heartbeat");
        }
      })();
      heartbeatPromiseRef.current = currentHeartbeat;
      try {
        await currentHeartbeat;
      } finally {
        if (heartbeatPromiseRef.current === currentHeartbeat) {
          heartbeatPromiseRef.current = null;
        }
      }
    };
    const interval = window.setInterval(heartbeat, 5 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [canReview, submission.id]);

  const saveChecklist = async () => {
    if (!workflowRef.current.claimToken) return;
    const checklistVersion =
      submission.checklistVersion ?? REVIEW_CHECKLIST_VERSION;
    const errors = validateChecklistDraft(
      submission.appMode,
      checklist,
      checklistVersion,
    );
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    const payload = await claimedWorkflowRequest({
      action: "checklist",
      method: "PUT",
      path: `/api/admin/reviewer/submissions/${submission.id}/checklist`,
      extraBody: {
        checklistVersion,
        checklist,
      },
    });
    if (payload && applyWorkflowPayload(payload, "checklist")) {
      setPersistedChecklistVersion(checklistVersion);
      updateChecklistDirty(false);
      toast.success("Checklist saved");
    }
  };

  const decide = async (decision: "approved" | "changes_requested") => {
    if (!workflowRef.current.claimToken) return;
    const payload = await claimedWorkflowRequest({
      action: decision,
      path: `/api/admin/reviewer/submissions/${submission.id}/decision`,
      extraBody: {
        appMetadataId: submission.appMetadataId,
        expectedMetadataUpdatedAt: submission.metadataUpdatedAt,
        decision,
        developerMessage,
        ...(overrideReason.trim() ? { overrideReason } : {}),
      },
    });
    if (payload) {
      clearReviewerClaimSession(submission.id);
      updateWorkflow((current) => ({ ...current, claimToken: null }));
      router.refresh();
    }
  };

  const hasActiveClaim = Boolean(workflow.claimToken);
  const checklistVersion =
    submission.checklistVersion ?? REVIEW_CHECKLIST_VERSION;
  const checklistPersisted = persistedChecklistVersion === checklistVersion;
  const testAvailable =
    workflow.status === "pending" || workflow.status === "in_review";
  const checklistVersionSupported =
    isReviewChecklistVersionSupported(checklistVersion);
  const checklistProgress = getChecklistProgress(
    submission.appMode,
    checklist,
    checklistVersion,
  );
  const approvalErrors = validateApprovalChecklist(
    submission.appMode,
    checklist,
    overrideReason,
    checklistVersion,
  );

  const currentPanel = useMemo(() => {
    switch (activePanel) {
      case "Metadata":
        return <ReviewMetadata submission={submission} />;
      case "Test":
        return testAvailable ? (
          <ReviewTestPanel
            appId={submission.appId}
            integrationUrl={submission.metadataSnapshot.integration_url}
            metadataId={submission.appMetadataId}
            mode={submission.appMode}
          />
        ) : (
          <section className="rounded-16 border border-grey-200 bg-grey-0 p-6">
            <h2 className="text-16 font-semibold text-grey-900">
              Test preview unavailable
            </h2>
            <p className="mt-2 text-13 leading-5 text-grey-500">
              Completed and withdrawn attempts cannot safely preview an exact
              draft. Review the immutable metadata and event history instead.
            </p>
          </section>
        );
      case "Guidelines":
        return (
          <ReviewGuidelines
            checklist={checklist}
            disabled={
              !hasActiveClaim ||
              Boolean(busyAction) ||
              !checklistVersionSupported
            }
            mode={submission.appMode}
            onChange={(nextChecklist) => {
              setChecklist(nextChecklist);
              updateChecklistDirty(true);
            }}
            version={checklistVersion}
          />
        );
      case "History":
        return (
          <ReviewHistory
            assetSnapshotRepair={submission.assetSnapshotRepair}
            canReview={canReview}
            events={submission.events}
            notifications={submission.notifications}
            reviewId={submission.id}
            reviewStatus={workflow.status}
          />
        );
      default:
        return <ReviewOverview submission={submission} />;
    }
  }, [
    activePanel,
    canReview,
    checklist,
    busyAction,
    hasActiveClaim,
    checklistVersion,
    checklistVersionSupported,
    submission,
    testAvailable,
    updateChecklistDirty,
  ]);

  return (
    <div className="grid min-h-0 gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="rounded-16 border border-grey-200 bg-grey-0/90 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Reviewer /{" "}
              {submission.appMode === "mini-app" ? "Mini App" : "External"}
            </p>
            <h1 className="mt-2 text-24 font-semibold tracking-[-0.02em] text-grey-900">
              {submission.appName}
            </h1>
            <p className="mt-1 font-mono text-11 text-grey-500">
              {submission.appId} · attempt {submission.attempt} ·{" "}
              {submission.id}
            </p>
          </div>
          <span className="rounded-full border border-grey-200 bg-grey-50 px-3 py-1.5 text-12 font-semibold text-grey-700">
            {workflow.status.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-auto">
        <main className="min-w-0">
          <div className="mb-4 rounded-12 border border-grey-200 bg-grey-0 px-6">
            <Tabs className="px-0!">
              {panels.map((panel) => (
                <button
                  aria-selected={activePanel === panel}
                  className={
                    activePanel === panel
                      ? "border-b-2 border-grey-900 px-3 py-3 text-13 font-semibold text-grey-900 disabled:cursor-not-allowed disabled:opacity-40"
                      : "border-b-2 border-transparent px-3 py-3 text-13 font-medium text-grey-500 disabled:cursor-not-allowed disabled:opacity-40"
                  }
                  disabled={panel === "Test" && !testAvailable}
                  key={panel}
                  onClick={() => setActivePanel(panel)}
                  role="tab"
                  type="button"
                >
                  {panel}
                </button>
              ))}
            </Tabs>
          </div>
          {currentPanel}
        </main>

        <aside
          className="grid content-start gap-4 self-start rounded-16 border border-grey-200 bg-grey-0/90 p-4 backdrop-blur-md lg:sticky lg:top-0"
          data-review-decision-rail
        >
          <ReviewClaimBar
            busy={Boolean(busyAction)}
            canReview={canReview}
            claimExpiresAt={workflow.claimExpiresAt}
            claimedByEmail={workflow.claimedByEmail}
            currentUserEmail={currentUserEmail}
            hasActiveClaim={hasActiveClaim}
            onClaim={claim}
            onRelease={release}
            reviewId={submission.id}
            reviewVersion={workflow.reviewVersion}
            status={workflow.status}
          />

          <section>
            <div className="flex items-center justify-between text-11 font-medium text-grey-500">
              <span>Checklist</span>
              <span>
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-grey-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${checklistProgress.percent}%` }}
              />
            </div>
          </section>

          <label className="grid gap-1 text-11 font-medium text-grey-500">
            Internal notes
            <textarea
              className="min-h-24 resize-y rounded-8 border border-grey-200 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
              disabled={
                !hasActiveClaim ||
                Boolean(busyAction) ||
                !checklistVersionSupported
              }
              onChange={(event) => {
                updateChecklistDirty(true);
                setChecklist((current) => ({
                  ...current,
                  internalNotes: event.target.value,
                }));
              }}
              value={checklist.internalNotes}
            />
          </label>
          <button
            className="rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-12 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              !hasActiveClaim ||
              (!checklistDirty && checklistPersisted) ||
              Boolean(busyAction) ||
              !checklistVersionSupported
            }
            onClick={saveChecklist}
            type="button"
          >
            Save checklist
          </button>

          <label className="grid gap-1 text-11 font-medium text-grey-500">
            Developer message
            <textarea
              className="min-h-24 resize-y rounded-8 border border-grey-200 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
              disabled={!hasActiveClaim || Boolean(busyAction)}
              onChange={(event) => setDeveloperMessage(event.target.value)}
              placeholder="Required when requesting changes"
              value={developerMessage}
            />
          </label>

          <label className="grid gap-1 text-11 font-medium text-grey-500">
            Override reason
            <textarea
              className="min-h-20 resize-y rounded-8 border border-grey-200 p-3 text-12 font-normal text-grey-900 disabled:bg-grey-100"
              disabled={!hasActiveClaim || Boolean(busyAction)}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Required for failed or incomplete checks"
              value={overrideReason}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-8 border border-system-error-300 bg-system-error-100 px-3 py-2.5 text-12 font-semibold text-system-error-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !hasActiveClaim ||
                !checklistPersisted ||
                checklistDirty ||
                !developerMessage.trim() ||
                Boolean(busyAction) ||
                !checklistVersionSupported
              }
              onClick={() => decide("changes_requested")}
              type="button"
            >
              Request changes
            </button>
            <button
              className="rounded-8 bg-system-success-600 px-3 py-2.5 text-12 font-semibold text-grey-0 disabled:cursor-not-allowed disabled:bg-grey-300"
              disabled={
                !hasActiveClaim ||
                !checklistPersisted ||
                checklistDirty ||
                approvalErrors.length > 0 ||
                Boolean(busyAction) ||
                !checklistVersionSupported
              }
              onClick={() => decide("approved")}
              type="button"
            >
              Approve
            </button>
          </div>
          {checklistDirty ? (
            <p className="text-11 leading-4 text-system-warning-700">
              Save checklist changes before deciding.
            </p>
          ) : !checklistPersisted ? (
            <p className="text-11 leading-4 text-system-warning-700">
              Save the versioned checklist before deciding.
            </p>
          ) : null}
          {approvalErrors.length ? (
            <p className="text-11 leading-4 text-system-warning-700">
              {approvalErrors[0]}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
};
