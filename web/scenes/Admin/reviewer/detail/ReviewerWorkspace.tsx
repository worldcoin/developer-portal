"use client";

import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH,
  REVIEWER_INTERNAL_NOTES_MAX_LENGTH,
  REVIEWER_OVERRIDE_REASON_MAX_LENGTH,
} from "@/lib/reviewer-limits";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  REVIEW_CHECKLIST_VERSION,
  getChecklistDefinitions,
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
import { ReviewHistory } from "./ReviewHistory";
import { ReviewMetadata } from "./ReviewMetadata";
import { ReviewOverview } from "./ReviewOverview";
import { ReviewerActionRail } from "./ReviewerActionRail";
import { ReviewerChecklist } from "./ReviewerChecklist";
import {
  appendReviewerNote,
  type ReviewerDecision,
  ReviewerDecisionComposer,
} from "./ReviewerDecisionComposer";
import { ReviewerDecisionConfirmation } from "./ReviewerDecisionConfirmation";
import { ReviewerHeader } from "./ReviewerHeader";
import { ReviewerTestTarget } from "./ReviewerTestTarget";
import {
  createChecklistSaveQueue,
  type ChecklistSaveQueueState,
} from "./checklist-save-queue";
import { parseReviewerPanel, type ReviewerPanel } from "./reviewer-panels";

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

type WorkflowErrorPayload = { code?: string; error?: string };

type ReviewerWorkspaceProps = {
  canReview: boolean;
  currentUserEmail: string;
  submission: ReviewerSubmissionDetail;
};

type StatefulReviewerWorkspaceProps = ReviewerWorkspaceProps & {
  activePanel: ReviewerPanel;
  onPanelChange: (panel: ReviewerPanel) => void;
};

const workflowStatusError = (status: number) => {
  if (status >= 500) {
    return `The review service is unavailable (${status}). Try again.`;
  }
  return `The review action was rejected (${status}). Check the request and try again.`;
};

const readWorkflowError = async (response: Response) => {
  if (response.status >= 400 && response.status < 500) {
    try {
      const payload = (await response.json()) as WorkflowErrorPayload;
      if (
        payload &&
        typeof payload.error === "string" &&
        payload.error.trim() &&
        payload.error.length <= 1_000
      ) {
        return payload.error.trim();
      }
    } catch {
      // Use the status fallback for malformed responses.
    }
  }
  return workflowStatusError(response.status);
};

const getPersistedChecklistVersion = (submission: ReviewerSubmissionDetail) =>
  submission.checklistVersion && submission.checklist.definitionSnapshot
    ? submission.checklistVersion
    : null;

const getEditableChecklist = ({
  internalNotes,
  items,
}: ReviewChecklist): ReviewChecklist => ({ internalNotes, items });

const claimedWriteBody = (workflow: WorkflowState) => ({
  claimToken: workflow.claimToken,
  expectedReviewVersion: workflow.reviewVersion,
});

const StatefulReviewerWorkspace = ({
  activePanel,
  canReview,
  currentUserEmail,
  onPanelChange,
  submission,
}: StatefulReviewerWorkspaceProps) => {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowState>({
    status: submission.status,
    reviewVersion: submission.reviewVersion,
    claimToken: null,
    claimExpiresAt: submission.claimExpiresAt,
    claimedByEmail: submission.claimedByEmail,
  });
  const [checklist, setChecklist] = useState<ReviewChecklist>(
    getEditableChecklist(submission.checklist),
  );
  const [persistedChecklistVersion, setPersistedChecklistVersion] = useState<
    string | null
  >(() => getPersistedChecklistVersion(submission));
  const persistedChecklistVersionRef = useRef(persistedChecklistVersion);
  persistedChecklistVersionRef.current = persistedChecklistVersion;
  const [checklistSaveState, setChecklistSaveState] =
    useState<ChecklistSaveQueueState>("idle");
  const [developerMessage, setDeveloperMessage] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [pendingDecision, setPendingDecision] =
    useState<ReviewerDecision | null>(null);
  const [mobileComposerOpen, setMobileComposerOpen] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const workflowRef = useRef(workflow);
  const checklistRef = useRef(checklist);
  checklistRef.current = checklist;
  const developerMessageRef = useRef(developerMessage);
  developerMessageRef.current = developerMessage;
  const overrideReasonRef = useRef(overrideReason);
  overrideReasonRef.current = overrideReason;
  const decisionReturnFocusRef = useRef<HTMLButtonElement>(null);
  const heartbeatPromiseRef = useRef<Promise<void> | null>(null);
  const workflowConflictRef = useRef(0);
  const busyActionRef = useRef<string | null>(null);
  const checklistSaveStateRef = useRef<ChecklistSaveQueueState>("idle");
  const mountedRef = useRef(true);
  const checklistContextRef = useRef({
    appMode: submission.appMode,
    submissionId: submission.id,
    version: submission.checklistVersion ?? REVIEW_CHECKLIST_VERSION,
  });
  checklistContextRef.current = {
    appMode: submission.appMode,
    submissionId: submission.id,
    version: submission.checklistVersion ?? REVIEW_CHECKLIST_VERSION,
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateBusyAction = useCallback((action: string | null) => {
    busyActionRef.current = action;
    setBusyAction(action);
  }, []);

  const updateChecklistSaveState = useCallback(
    (state: ChecklistSaveQueueState) => {
      checklistSaveStateRef.current = state;
      setChecklistSaveState(state);
    },
    [],
  );

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
    const next: WorkflowState = {
      status: submission.status,
      reviewVersion: submission.reviewVersion,
      claimToken: null,
      claimExpiresAt: submission.claimExpiresAt,
      claimedByEmail: submission.claimedByEmail,
    };
    workflowRef.current = next;
    setWorkflow(next);
    if (
      checklistSaveStateRef.current !== "saving" &&
      checklistSaveStateRef.current !== "error"
    ) {
      setChecklist(getEditableChecklist(submission.checklist));
      const nextPersistedVersion = getPersistedChecklistVersion(submission);
      persistedChecklistVersionRef.current = nextPersistedVersion;
      setPersistedChecklistVersion(nextPersistedVersion);
    }
  }, [submission, updateChecklistSaveState]);

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
      isCurrent,
    }: {
      action: string;
      body: Record<string, unknown>;
      isCurrent?: () => boolean;
      method?: "POST" | "PUT";
      path: string;
      quiet?: boolean;
    }) => {
      if (!quiet) updateBusyAction(action);
      const requestIsCurrent = () =>
        mountedRef.current && (!isCurrent || isCurrent());
      try {
        const response = await fetch(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!requestIsCurrent()) return null;
        if (response.status === 409) {
          workflowConflictRef.current += 1;
          clearReviewerClaimSession(submission.id);
          updateWorkflow((current) => ({ ...current, claimToken: null }));
          setPendingDecision(null);
          setMobileComposerOpen(false);
          setDecisionError(null);
          toast.error(
            "The claim or review version changed. Reload and reclaim.",
          );
          router.refresh();
          return null;
        }
        if (!response.ok) {
          const message = await readWorkflowError(response);
          if (!requestIsCurrent()) return null;
          if (action === "approved" || action === "changes_requested") {
            setDecisionError(message);
          }
          toast.error(message);
          return null;
        }
        const payload = (await response.json()) as WorkflowPayload;
        if (!requestIsCurrent()) return null;
        return payload;
      } catch {
        if (!requestIsCurrent()) return null;
        const message =
          "The review action could not reach the server. Check your connection and try again.";
        if (action === "approved" || action === "changes_requested") {
          setDecisionError(message);
        }
        toast.error(message);
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
      if (
        heartbeatPromiseRef.current ||
        busyActionRef.current ||
        checklistSaveStateRef.current === "saving"
      )
        return;
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
      const heartbeatSubmissionId = submission.id;
      const isCurrentHeartbeat = () => mountedRef.current;
      const currentHeartbeat = (async () => {
        const payload = await workflowRequestRef.current({
          action: "heartbeat",
          path: `/api/admin/reviewer/submissions/${heartbeatSubmissionId}/heartbeat`,
          body: claimedWriteBody(workflowRef.current),
          quiet: true,
          isCurrent: isCurrentHeartbeat,
        });
        if (payload && isCurrentHeartbeat()) {
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

  const saveChecklistSnapshot = useCallback(
    async (snapshot: ReviewChecklist) => {
      const isCurrentChecklistSave = () => mountedRef.current;
      await heartbeatPromiseRef.current;
      if (!isCurrentChecklistSave()) return false;
      const current = workflowRef.current;
      if (!current.claimToken) return false;
      const checklistContext = checklistContextRef.current;
      if (checklistContext.submissionId !== submission.id) return false;

      const errors = validateChecklistDraft(
        checklistContext.appMode,
        snapshot,
        checklistContext.version,
      );
      if (errors.length) {
        toast.error(errors[0]);
        return false;
      }

      const payload = await workflowRequest({
        action: "checklist",
        method: "PUT",
        path: `/api/admin/reviewer/submissions/${checklistContext.submissionId}/checklist`,
        quiet: true,
        isCurrent: isCurrentChecklistSave,
        body: {
          ...claimedWriteBody(current),
          checklistVersion: checklistContext.version,
          checklist: snapshot,
        },
      });
      if (payload && applyWorkflowPayload(payload, "checklist")) {
        persistedChecklistVersionRef.current = checklistContext.version;
        setPersistedChecklistVersion(checklistContext.version);
        return true;
      }
      return false;
    },
    [applyWorkflowPayload, submission.id, workflowRequest],
  );

  const saveChecklistSnapshotRef = useRef(saveChecklistSnapshot);
  saveChecklistSnapshotRef.current = saveChecklistSnapshot;
  const checklistSaveQueue = useMemo(
    () =>
      createChecklistSaveQueue({
        onStateChange: updateChecklistSaveState,
        save: (snapshot) => saveChecklistSnapshotRef.current(snapshot),
      }),
    [submission.id, updateChecklistSaveState],
  );

  useEffect(
    () => () => {
      checklistSaveQueue.reset();
    },
    [checklistSaveQueue],
  );

  const enqueueChecklist = useCallback(
    (nextChecklist: ReviewChecklist) => {
      const editableChecklist = getEditableChecklist(nextChecklist);
      setChecklist(editableChecklist);
      void checklistSaveQueue.enqueue(editableChecklist);
    },
    [checklistSaveQueue],
  );

  const selectOutcome = (decision: ReviewerDecision) => {
    setDecisionError(null);
    setPendingDecision(decision);
  };

  const confirmDecision = async (decision: ReviewerDecision) => {
    if (busyActionRef.current) return;
    const decisionSubmissionId = submission.id;
    const conflictGeneration = workflowConflictRef.current;
    const isCurrentDecision = () => mountedRef.current;
    const canContinueDecision = () =>
      isCurrentDecision() && workflowConflictRef.current === conflictGeneration;
    const rejectDecision = (message: string) => {
      if (!isCurrentDecision()) return;
      setDecisionError(message);
      toast.error(message);
    };

    updateBusyAction(decision);
    setDecisionError(null);
    try {
      await heartbeatPromiseRef.current;
      if (!canContinueDecision()) return;

      const checklistSaved = await checklistSaveQueue.flush();
      if (!canContinueDecision()) return;
      if (!checklistSaved) {
        if (workflowRef.current.claimToken) {
          rejectDecision("Checklist save failed. Retry save before deciding.");
        }
        return;
      }

      const currentWorkflow = workflowRef.current;
      const currentChecklist = checklistRef.current;
      const checklistContext = checklistContextRef.current;
      const currentDeveloperMessage = developerMessageRef.current;
      const currentOverrideReason = overrideReasonRef.current;

      if (
        checklistContext.submissionId !== decisionSubmissionId ||
        currentWorkflow.status !== "in_review" ||
        !currentWorkflow.claimToken
      ) {
        rejectDecision("Claim this review again before deciding.");
        return;
      }
      if (!isReviewChecklistVersionSupported(checklistContext.version)) {
        rejectDecision(
          `Checklist version ${checklistContext.version} is not supported.`,
        );
        return;
      }
      if (persistedChecklistVersionRef.current !== checklistContext.version) {
        rejectDecision("Save the versioned checklist before deciding.");
        return;
      }
      const checklistErrors = validateChecklistDraft(
        checklistContext.appMode,
        currentChecklist,
        checklistContext.version,
      );
      if (checklistErrors.length) {
        rejectDecision(checklistErrors[0]);
        return;
      }
      if (
        currentDeveloperMessage.length > REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH
      ) {
        rejectDecision("The developer message is too long.");
        return;
      }
      if (decision === "changes_requested" && !currentDeveloperMessage.trim()) {
        rejectDecision(
          "A message to the developer is required to request changes.",
        );
        return;
      }
      if (currentOverrideReason.length > REVIEWER_OVERRIDE_REASON_MAX_LENGTH) {
        rejectDecision("The override reason is too long.");
        return;
      }
      if (decision === "approved") {
        const currentApprovalErrors = validateApprovalChecklist(
          checklistContext.appMode,
          currentChecklist,
          currentOverrideReason,
          checklistContext.version,
        );
        if (currentApprovalErrors.length) {
          rejectDecision(currentApprovalErrors[0]);
          return;
        }
      }

      const payload = await workflowRequest({
        action: decision,
        path: `/api/admin/reviewer/submissions/${decisionSubmissionId}/decision`,
        quiet: true,
        isCurrent: isCurrentDecision,
        body: {
          ...claimedWriteBody(currentWorkflow),
          appMetadataId: submission.appMetadataId,
          expectedMetadataUpdatedAt: submission.metadataUpdatedAt,
          decision,
          developerMessage: currentDeveloperMessage,
          ...(currentOverrideReason.trim()
            ? { overrideReason: currentOverrideReason }
            : {}),
        },
      });
      if (!payload || !canContinueDecision()) return;
      if (!payload.submission) {
        rejectDecision(
          "The review service returned an invalid response. Try again.",
        );
        return;
      }

      clearReviewerClaimSession(decisionSubmissionId);
      updateWorkflow((current) => ({
        ...current,
        status: payload.submission!.status as ReviewerSubmissionStatus,
        reviewVersion: payload.submission!.reviewVersion,
        claimToken: null,
        claimExpiresAt: null,
        claimedByEmail: null,
      }));
      checklistSaveQueue.reset();
      setDeveloperMessage("");
      setOverrideReason("");
      setPendingDecision(null);
      setMobileComposerOpen(false);
      setDecisionError(null);
      decisionReturnFocusRef.current = null;
      router.refresh();
    } finally {
      updateBusyAction(null);
    }
  };

  const hasActiveClaim = Boolean(workflow.claimToken);
  const checklistVersion =
    submission.checklistVersion ?? REVIEW_CHECKLIST_VERSION;
  const checklistPersisted = persistedChecklistVersion === checklistVersion;
  const checklistVersionSupported =
    isReviewChecklistVersionSupported(checklistVersion);
  const checklistProgress = getChecklistProgress(
    submission.appMode,
    checklist,
    checklistVersion,
  );
  const checklistErrors = validateChecklistDraft(
    submission.appMode,
    checklist,
    checklistVersion,
  );
  const approvalWithoutOverride = validateApprovalChecklist(
    submission.appMode,
    checklist,
    "",
    checklistVersion,
  );
  const blockedApprovalReason = approvalWithoutOverride.includes(
    "Override reason is required when checks fail or remain incomplete",
  )
    ? "Override reason is required when checks fail or remain incomplete"
    : null;
  const decisionDisabledReason = !hasActiveClaim
    ? "Claim or recover this review before deciding."
    : Boolean(busyAction)
      ? "Wait for the current review action to finish."
      : !checklistVersionSupported
        ? `Checklist version ${checklistVersion} is not supported.`
        : checklistSaveState === "saving"
          ? "Wait for checklist changes to finish saving."
          : checklistSaveState === "error"
            ? "Retry the failed checklist save before deciding."
            : !checklistPersisted
              ? "Save the versioned checklist before deciding."
              : checklistErrors[0] ?? null;
  const approvalDisabledReason =
    decisionDisabledReason ??
    approvalWithoutOverride.find(
      (error) =>
        error !==
        "Override reason is required when checks fail or remain incomplete",
    ) ??
    null;
  const failedLabels = getChecklistDefinitions(
    submission.appMode,
    checklistVersion,
  )
    .filter((definition) =>
      checklist.items.some(
        (item) => item.id === definition.id && item.status === "fail",
      ),
    )
    .map((definition) => definition.title);
  const testTarget = {
    appId: submission.appId,
    appName: submission.appName,
    integrationUrl: submission.metadataSnapshot.integration_url,
    metadataId: submission.appMetadataId,
    mode: submission.appMode,
  };
  const renderDecisionComposer = () => (
    <ReviewerDecisionComposer
      approvalDisabledReason={approvalDisabledReason}
      blockedApprovalReason={blockedApprovalReason}
      decisionError={decisionError}
      developerMessage={developerMessage}
      onDeveloperMessageChange={setDeveloperMessage}
      onOverrideReasonChange={setOverrideReason}
      onSelectOutcome={selectOutcome}
      overrideReason={overrideReason}
      requestChangesDisabledReason={decisionDisabledReason}
      returnFocusRef={decisionReturnFocusRef}
      saveState={checklistSaveState}
    />
  );
  const renderReviewControls = () => (
    <>
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

      <label className="grid gap-1 text-12 font-medium text-grey-700">
        Internal notes
        <textarea
          className="min-h-24 resize-y rounded-8 border border-grey-200 p-3 text-13 font-normal text-grey-900 disabled:bg-grey-100"
          disabled={
            !hasActiveClaim || Boolean(busyAction) || !checklistVersionSupported
          }
          maxLength={REVIEWER_INTERNAL_NOTES_MAX_LENGTH}
          onChange={(event) => {
            enqueueChecklist({
              ...checklist,
              internalNotes: event.target.value,
            });
          }}
          value={checklist.internalNotes}
        />
      </label>
      {renderDecisionComposer()}
    </>
  );
  const currentPanel =
    activePanel === "app-data" ? (
      <ReviewMetadata submission={submission} />
    ) : activePanel === "activity" ? (
      <ReviewHistory
        assetSnapshotRepair={submission.assetSnapshotRepair}
        canReview={canReview}
        events={submission.events}
        notifications={submission.notifications}
        reviewId={submission.id}
        reviewStatus={workflow.status}
      />
    ) : (
      <div className="grid gap-5">
        <ReviewOverview submission={submission} />
        <ReviewerChecklist
          checklist={checklist}
          definitionSnapshot={submission.checklist.definitionSnapshot}
          disabled={
            !hasActiveClaim || Boolean(busyAction) || !checklistVersionSupported
          }
          mode={submission.appMode}
          onAddNote={(note) =>
            setDeveloperMessage((message) => appendReviewerNote(message, note))
          }
          onChange={enqueueChecklist}
          onRetrySave={() => void checklistSaveQueue.retry()}
          saveState={checklistSaveState}
          version={checklistVersion}
        />
      </div>
    );

  return (
    <div className="grid min-h-0 gap-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
      <ReviewerHeader
        activePanel={activePanel}
        appId={submission.appId}
        appMode={submission.appMode}
        appName={submission.appName}
        attempt={submission.attempt}
        onPanelChange={onPanelChange}
        status={workflow.status}
      />

      <div
        className="flex min-h-0 flex-col gap-4 pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden lg:pb-0"
        data-testid="reviewer-workspace-body"
      >
        <main className="order-2 min-w-0 lg:order-none lg:overflow-y-auto lg:pr-1">
          <section
            aria-labelledby={`reviewer-tab-${activePanel}`}
            id={`reviewer-panel-${activePanel}`}
            role="tabpanel"
            tabIndex={0}
          >
            {currentPanel}
          </section>
        </main>

        <ReviewerActionRail
          checklistProgress={checklistProgress}
          onOpenComposer={() => setMobileComposerOpen(true)}
          saveState={checklistSaveState}
          testTarget={testTarget}
        >
          {mobileComposerOpen ? null : renderReviewControls()}
        </ReviewerActionRail>
      </div>

      <Sheet onOpenChange={setMobileComposerOpen} open={mobileComposerOpen}>
        <SheetContent
          className="max-h-[90dvh] overflow-y-auto lg:hidden"
          side="bottom"
        >
          <SheetHeader>
            <SheetTitle>Message and decide</SheetTitle>
            <SheetDescription>
              Edit the developer message, then choose an outcome to review
              before sending.
            </SheetDescription>
            <div className="mt-3">
              <ReviewerTestTarget {...testTarget} compact />
            </div>
          </SheetHeader>
          <div className="grid gap-4 px-4 pb-4">{renderReviewControls()}</div>
        </SheetContent>
      </Sheet>

      <ReviewerDecisionConfirmation
        busy={busyAction === "approved" || busyAction === "changes_requested"}
        checklistProgress={checklistProgress}
        decision={pendingDecision}
        decisionError={decisionError}
        developerMessage={developerMessage}
        failedLabels={failedLabels}
        onConfirm={confirmDecision}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDecision(null);
            setDecisionError(null);
          }
        }}
        open={pendingDecision !== null}
        returnFocusRef={decisionReturnFocusRef}
        testTarget={testTarget}
      />
    </div>
  );
};

type PanelState = {
  panel: ReviewerPanel;
  submissionId: string;
  waitingForResetUrl: boolean;
};

export const ReviewerWorkspace = ({
  canReview,
  currentUserEmail,
  submission,
}: ReviewerWorkspaceProps) => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const requestedPanel = parseReviewerPanel(searchParams.get("panel"));
  const [panelState, setPanelState] = useState<PanelState>(() => ({
    panel: requestedPanel,
    submissionId: submission.id,
    waitingForResetUrl: false,
  }));
  const submissionChanged = panelState.submissionId !== submission.id;

  const replacePanelUrl = useCallback(
    (panel: ReviewerPanel) => {
      const nextParams = new URLSearchParams(searchParamsString);
      if (panel === "review") nextParams.delete("panel");
      else nextParams.set("panel", panel);
      const query = nextParams.toString();
      replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, replace, searchParamsString],
  );

  useEffect(() => {
    if (!submissionChanged) return;
    setPanelState({
      panel: "review",
      submissionId: submission.id,
      waitingForResetUrl: true,
    });
    replacePanelUrl("review");
  }, [replacePanelUrl, submission.id, submissionChanged]);

  useEffect(() => {
    setPanelState((current) => {
      if (current.submissionId !== submission.id) return current;
      if (current.waitingForResetUrl) {
        if (requestedPanel !== "review") return current;
        return { ...current, panel: "review", waitingForResetUrl: false };
      }
      if (current.panel === requestedPanel) return current;
      return { ...current, panel: requestedPanel };
    });
  }, [requestedPanel, submission.id]);

  const selectPanel = useCallback(
    (panel: ReviewerPanel) => {
      setPanelState({
        panel,
        submissionId: submission.id,
        waitingForResetUrl: false,
      });
      replacePanelUrl(panel);
    },
    [replacePanelUrl, submission.id],
  );

  return (
    <StatefulReviewerWorkspace
      activePanel={submissionChanged ? "review" : panelState.panel}
      canReview={canReview}
      currentUserEmail={currentUserEmail}
      key={submission.id}
      onPanelChange={selectPanel}
      submission={submission}
    />
  );
};
