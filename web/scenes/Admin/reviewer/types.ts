import type { StoredReviewChecklist } from "@/api/admin/reviewer/request-schema";

export type ReviewerAppMode = "mini-app" | "external";

export type ReviewerSubmissionStatus =
  | "pending"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "withdrawn";

export type ReviewerQueueRow = {
  id: string;
  appId: string;
  appMetadataId: string;
  appName: string;
  appMode: ReviewerAppMode;
  attempt: number;
  changelog: string;
  claimedByEmail: string | null;
  claimExpiresAt: string | null;
  listingTarget: "mini_app_store" | "world_ecosystem";
  reviewVersion: number;
  status: ReviewerSubmissionStatus;
  submittedAt: string;
  teamId: string;
  teamName: string;
};

export type ReviewerEvent = {
  id: string;
  eventType: string;
  eventSequence: number;
  actorEmail: string | null;
  actorSubject: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
  reviewVersion: number | null;
};

export type ReviewerNotification = {
  id: string;
  attemptCount: number;
  channel: string;
  createdAt: string;
  deliveredAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  nextAttemptAt: string;
  notificationType: string;
  providerMessageId: string | null;
  recipient: string | null;
  retryable?: boolean;
  status: string;
  updatedAt: string;
};

export type ReviewerAsset = {
  id: string;
  kind: "logo" | "hero" | "meta_tag" | "showcase" | "content_card";
  label: string;
  locale: string;
  signedUrl: string;
};

export type ReviewerWorldIdConfiguration = {
  legacyActions: Array<{
    action: string;
    appFlowOnComplete: string | null;
    creationMode: string;
    description: string;
    id: string;
    kioskEnabled: boolean;
    maxAccountsPerUser: number;
    maxVerifications: number;
    name: string;
    postActionDeepLinkAndroid: string | null;
    postActionDeepLinkIos: string | null;
    privacyPolicyUri: string | null;
    status: string;
    termsUri: string | null;
    webhookUri: string | null;
    redirects: Array<{
      id: string;
      redirectUri: string;
    }>;
  }>;
  registrations: Array<{
    mode: string;
    rpId: string;
    signerAddress: string | null;
    stagingStatus: string | null;
    status: string;
    actions: Array<{
      action: string;
      description: string;
      environment: string;
      id: string;
    }>;
  }>;
};

export type ReviewerSubmissionDetail = ReviewerQueueRow & {
  assetSnapshotRepair?: {
    ready: boolean;
    attemptCount: number;
    deadLetteredAt: string | null;
    lastError: string | null;
    nextAttemptAt: string | null;
  };
  checklist: StoredReviewChecklist;
  checklistVersion: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  decidedAt: string | null;
  decidedByEmail: string | null;
  decisionSummary: string | null;
  events: ReviewerEvent[];
  listingConsent: boolean;
  localizationsSnapshot: Array<Record<string, unknown>>;
  metadataSnapshot: Record<string, unknown>;
  metadataUpdatedAt: string;
  notifications: ReviewerNotification[];
  liveMetadata: Record<string, unknown> | null;
  liveLocalizations: Array<Record<string, unknown>>;
  worldIdConfiguration: ReviewerWorldIdConfiguration;
};
