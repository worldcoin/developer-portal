/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchReviewChecklistContextQueryVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
}>;

export type FetchReviewChecklistContextQuery = {
  __typename?: "query_root";
  app_review_submission_by_pk?: {
    __typename?: "app_review_submission";
    id: unknown;
    app_mode: string;
    checklist_version?: string | null;
  } | null;
};

export type FetchReviewDecisionContextQueryVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
}>;

export type FetchReviewDecisionContextQuery = {
  __typename?: "query_root";
  app_review_submission_by_pk?: {
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    claimed_by_subject?: string | null;
    checklist_version?: string | null;
    checklist: any;
    app_metadata_id: string;
    app_id: string;
    team_id: string;
    app_mode: string;
    listing_target: string;
    listing_consent: boolean;
    metadata_updated_at: string;
    metadata_snapshot: any;
    localizations_snapshot: any;
    decision_fingerprint?: string | null;
    decision_result?: any | null;
    decided_by_subject?: string | null;
    app_metadata?: {
      __typename?: "app_metadata";
      id: string;
      app_id: string;
      updated_at: string;
      verification_status: string;
      app_mode: string;
      is_developer_allow_listing: boolean;
    } | null;
    app: {
      __typename?: "app";
      id: string;
      is_staging: boolean;
      deleted_at?: string | null;
      first_verified_at?: string | null;
      app_metadata: Array<{
        __typename?: "app_metadata";
        id: string;
        app_id: string;
        updated_at: string;
        verification_status: string;
        logo_img_url: string;
        hero_image_url: string;
        meta_tag_image_url: string;
        content_card_image_url: string;
        showcase_img_urls?: Array<string> | null;
        localisations: Array<{
          __typename?: "localisations";
          id: string;
          app_metadata_id: string;
          locale: string;
          name: string;
          description: string;
          world_app_button_text: string;
          world_app_description: string;
          short_name: string;
          created_at: string;
          updated_at: string;
          hero_image_url: string;
          meta_tag_image_url: string;
          showcase_img_urls?: Array<string> | null;
        }>;
      }>;
    };
  } | null;
};

export type FetchReviewDecisionOutcomeQueryVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
}>;

export type FetchReviewDecisionOutcomeQuery = {
  __typename?: "query_root";
  app_review_submission_by_pk?: {
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
    decision_fingerprint?: string | null;
    decision_result?: any | null;
    decided_by_subject?: string | null;
  } | null;
};

export type HasActiveListingReviewQueryVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type HasActiveListingReviewQuery = {
  __typename?: "query_root";
  app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
  }>;
};

export type ClaimReviewNotificationsMutationVariables = Types.Exact<{
  worker_id: Types.Scalars["String"]["input"];
  limit: Types.Scalars["Int"]["input"];
}>;

export type ClaimReviewNotificationsMutation = {
  __typename?: "mutation_root";
  reviewer_claim_app_review_notifications: Array<{
    __typename?: "app_review_notification";
    id: unknown;
    submission_id: unknown;
    notification_type: string;
    channel: string;
    status: string;
    recipient?: string | null;
    payload: any;
    attempt_count: number;
    locked_at?: string | null;
    locked_by?: string | null;
  }>;
};

export type FetchReviewNotificationContextQueryVariables = Types.Exact<{
  notification_id: Types.Scalars["uuid"]["input"];
}>;

export type FetchReviewNotificationContextQuery = {
  __typename?: "query_root";
  app_review_notification_by_pk?: {
    __typename?: "app_review_notification";
    id: unknown;
    submission_id: unknown;
    notification_type: string;
    channel: string;
    status: string;
    recipient?: string | null;
    payload: any;
    attempt_count: number;
    locked_at?: string | null;
    locked_by?: string | null;
    submission: {
      __typename?: "app_review_submission";
      id: unknown;
      app_id: string;
      app_metadata_id: string;
      app_mode: string;
      listing_target: string;
      status: string;
      review_version: number;
      decision_fingerprint?: string | null;
      decision_result?: any | null;
      changelog: string;
      submitted_at: string;
      decision_summary?: string | null;
      metadata_snapshot: any;
      team_id: string;
      claim_expires_at?: string | null;
      app: { __typename?: "app"; name: string };
      team: { __typename?: "team"; name?: string | null };
    };
  } | null;
};

export type CompleteReviewNotificationMutationVariables = Types.Exact<{
  notification_id: Types.Scalars["uuid"]["input"];
  worker_id: Types.Scalars["String"]["input"];
  outcome: Types.Scalars["String"]["input"];
  provider_message_id?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  error?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type CompleteReviewNotificationMutation = {
  __typename?: "mutation_root";
  reviewer_complete_app_review_notification: Array<{
    __typename?: "app_review_notification";
    id: unknown;
    status: string;
    attempt_count: number;
    next_attempt_at: string;
    delivered_at?: string | null;
  }>;
};

export type RetryReviewNotificationMutationVariables = Types.Exact<{
  notification_id: Types.Scalars["uuid"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type RetryReviewNotificationMutation = {
  __typename?: "mutation_root";
  reviewer_retry_app_review_notification: Array<{
    __typename?: "app_review_notification";
    id: unknown;
    status: string;
    attempt_count: number;
    next_attempt_at: string;
    delivered_at?: string | null;
  }>;
};

export type ClaimReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type ClaimReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_claim_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type HeartbeatReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type HeartbeatReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_heartbeat_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type ReleaseReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type ReleaseReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_release_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type SaveReviewChecklistMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  checklist_version: Types.Scalars["String"]["input"];
  checklist: Types.Scalars["jsonb"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type SaveReviewChecklistMutation = {
  __typename?: "mutation_root";
  reviewer_save_app_review_checklist: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type EnqueueReviewAssetCleanupMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  decision_fingerprint: Types.Scalars["String"]["input"];
  operation_id: Types.Scalars["String"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  app_metadata_id: Types.Scalars["String"]["input"];
  asset_keys: Types.Scalars["jsonb"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type EnqueueReviewAssetCleanupMutation = {
  __typename?: "mutation_root";
  reviewer_enqueue_app_review_asset_cleanup: Array<{
    __typename?: "app_review_notification";
    id: unknown;
    status: string;
  }>;
};

export type SettleReviewAssetCleanupMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  decision_fingerprint: Types.Scalars["String"]["input"];
  operation_id: Types.Scalars["String"]["input"];
  settlement_state: Types.Scalars["String"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type SettleReviewAssetCleanupMutation = {
  __typename?: "mutation_root";
  reviewer_settle_app_review_asset_cleanup: Array<{
    __typename?: "app_review_notification";
    id: unknown;
    status: string;
  }>;
};

export type DecideReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  app_metadata_id: Types.Scalars["String"]["input"];
  expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
  decision: Types.Scalars["String"]["input"];
  developer_message: Types.Scalars["String"]["input"];
  override_reason?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  decision_fingerprint: Types.Scalars["String"]["input"];
  expected_prior_verified_id?: Types.InputMaybe<
    Types.Scalars["String"]["input"]
  >;
  expected_prior_verified_updated_at?: Types.InputMaybe<
    Types.Scalars["timestamptz"]["input"]
  >;
  expected_prior_localizations_snapshot: Types.Scalars["jsonb"]["input"];
  metadata_assets: Types.Scalars["jsonb"]["input"];
  localization_assets: Types.Scalars["jsonb"]["input"];
  prepared_asset_keys: Types.Scalars["jsonb"]["input"];
  old_asset_keys: Types.Scalars["jsonb"]["input"];
  failed_checks: Types.Scalars["jsonb"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type DecideReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_decide_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
    decision_result?: any | null;
  }>;
};

export const FetchReviewChecklistContextDocument = gql`
  query FetchReviewChecklistContext($submission_id: uuid!) {
    app_review_submission_by_pk(id: $submission_id) {
      id
      app_mode
      checklist_version
    }
  }
`;
export const FetchReviewDecisionContextDocument = gql`
  query FetchReviewDecisionContext($submission_id: uuid!) {
    app_review_submission_by_pk(id: $submission_id) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      claimed_by_subject
      checklist_version
      checklist
      app_metadata_id
      app_id
      team_id
      app_mode
      listing_target
      listing_consent
      metadata_updated_at
      metadata_snapshot
      localizations_snapshot
      decision_fingerprint
      decision_result
      decided_by_subject
      app_metadata {
        id
        app_id
        updated_at
        verification_status
        app_mode
        is_developer_allow_listing
      }
      app {
        id
        is_staging
        deleted_at
        first_verified_at
        app_metadata(where: { verification_status: { _eq: "verified" } }) {
          id
          app_id
          updated_at
          verification_status
          logo_img_url
          hero_image_url
          meta_tag_image_url
          content_card_image_url
          showcase_img_urls
          localisations(order_by: [{ locale: asc }, { id: asc }]) {
            id
            app_metadata_id
            locale
            name
            description
            world_app_button_text
            world_app_description
            short_name
            created_at
            updated_at
            hero_image_url
            meta_tag_image_url
            showcase_img_urls
          }
        }
      }
    }
  }
`;
export const FetchReviewDecisionOutcomeDocument = gql`
  query FetchReviewDecisionOutcome($submission_id: uuid!) {
    app_review_submission_by_pk(id: $submission_id) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
      decision_fingerprint
      decision_result
      decided_by_subject
    }
  }
`;
export const HasActiveListingReviewDocument = gql`
  query HasActiveListingReview($app_metadata_id: String!) {
    app_review_submission(
      limit: 1
      where: {
        app_metadata_id: { _eq: $app_metadata_id }
        status: { _in: ["pending", "in_review"] }
      }
    ) {
      id
    }
  }
`;
export const ClaimReviewNotificationsDocument = gql`
  mutation ClaimReviewNotifications($worker_id: String!, $limit: Int!) {
    reviewer_claim_app_review_notifications(
      args: { p_worker_id: $worker_id, p_limit: $limit }
    ) {
      id
      submission_id
      notification_type
      channel
      status
      recipient
      payload
      attempt_count
      locked_at
      locked_by
    }
  }
`;
export const FetchReviewNotificationContextDocument = gql`
  query FetchReviewNotificationContext($notification_id: uuid!) {
    app_review_notification_by_pk(id: $notification_id) {
      id
      submission_id
      notification_type
      channel
      status
      recipient
      payload
      attempt_count
      locked_at
      locked_by
      submission {
        id
        app_id
        app_metadata_id
        app_mode
        listing_target
        status
        review_version
        decision_fingerprint
        decision_result
        changelog
        submitted_at
        decision_summary
        metadata_snapshot
        team_id
        claim_expires_at
        app {
          name
        }
        team {
          name
        }
      }
    }
  }
`;
export const CompleteReviewNotificationDocument = gql`
  mutation CompleteReviewNotification(
    $notification_id: uuid!
    $worker_id: String!
    $outcome: String!
    $provider_message_id: String
    $error: String
  ) {
    reviewer_complete_app_review_notification(
      args: {
        p_notification_id: $notification_id
        p_worker_id: $worker_id
        p_outcome: $outcome
        p_provider_message_id: $provider_message_id
        p_error: $error
      }
    ) {
      id
      status
      attempt_count
      next_attempt_at
      delivered_at
    }
  }
`;
export const RetryReviewNotificationDocument = gql`
  mutation RetryReviewNotification(
    $notification_id: uuid!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_retry_app_review_notification(
      args: {
        p_notification_id: $notification_id
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      attempt_count
      next_attempt_at
      delivered_at
    }
  }
`;
export const ClaimReviewSubmissionDocument = gql`
  mutation ClaimReviewSubmission(
    $submission_id: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_claim_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const HeartbeatReviewSubmissionDocument = gql`
  mutation HeartbeatReviewSubmission(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_heartbeat_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const ReleaseReviewSubmissionDocument = gql`
  mutation ReleaseReviewSubmission(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_release_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const SaveReviewChecklistDocument = gql`
  mutation SaveReviewChecklist(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $checklist_version: String!
    $checklist: jsonb!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_save_app_review_checklist(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_checklist_version: $checklist_version
        p_checklist: $checklist
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const EnqueueReviewAssetCleanupDocument = gql`
  mutation EnqueueReviewAssetCleanup(
    $submission_id: uuid!
    $decision_fingerprint: String!
    $operation_id: String!
    $expected_review_version: Int!
    $app_metadata_id: String!
    $asset_keys: jsonb!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_enqueue_app_review_asset_cleanup(
      args: {
        p_submission_id: $submission_id
        p_decision_fingerprint: $decision_fingerprint
        p_operation_id: $operation_id
        p_expected_review_version: $expected_review_version
        p_app_metadata_id: $app_metadata_id
        p_asset_keys: $asset_keys
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
    }
  }
`;
export const SettleReviewAssetCleanupDocument = gql`
  mutation SettleReviewAssetCleanup(
    $submission_id: uuid!
    $decision_fingerprint: String!
    $operation_id: String!
    $settlement_state: String!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_settle_app_review_asset_cleanup(
      args: {
        p_submission_id: $submission_id
        p_decision_fingerprint: $decision_fingerprint
        p_operation_id: $operation_id
        p_settlement_state: $settlement_state
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
    }
  }
`;
export const DecideReviewSubmissionDocument = gql`
  mutation DecideReviewSubmission(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $app_metadata_id: String!
    $expected_metadata_updated_at: timestamptz!
    $decision: String!
    $developer_message: String!
    $override_reason: String
    $decision_fingerprint: String!
    $expected_prior_verified_id: String
    $expected_prior_verified_updated_at: timestamptz
    $expected_prior_localizations_snapshot: jsonb!
    $metadata_assets: jsonb!
    $localization_assets: jsonb!
    $prepared_asset_keys: jsonb!
    $old_asset_keys: jsonb!
    $failed_checks: jsonb!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_decide_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_app_metadata_id: $app_metadata_id
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_decision: $decision
        p_developer_message: $developer_message
        p_override_reason: $override_reason
        p_decision_fingerprint: $decision_fingerprint
        p_expected_prior_verified_id: $expected_prior_verified_id
        p_expected_prior_verified_updated_at: $expected_prior_verified_updated_at
        p_expected_prior_localizations_snapshot: $expected_prior_localizations_snapshot
        p_metadata_assets: $metadata_assets
        p_localization_assets: $localization_assets
        p_prepared_asset_keys: $prepared_asset_keys
        p_old_asset_keys: $old_asset_keys
        p_failed_checks: $failed_checks
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
      decision_result
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    FetchReviewChecklistContext(
      variables: FetchReviewChecklistContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewChecklistContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewChecklistContextQuery>(
            FetchReviewChecklistContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewChecklistContext",
        "query",
        variables,
      );
    },
    FetchReviewDecisionContext(
      variables: FetchReviewDecisionContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewDecisionContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewDecisionContextQuery>(
            FetchReviewDecisionContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewDecisionContext",
        "query",
        variables,
      );
    },
    FetchReviewDecisionOutcome(
      variables: FetchReviewDecisionOutcomeQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewDecisionOutcomeQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewDecisionOutcomeQuery>(
            FetchReviewDecisionOutcomeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewDecisionOutcome",
        "query",
        variables,
      );
    },
    HasActiveListingReview(
      variables: HasActiveListingReviewQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<HasActiveListingReviewQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<HasActiveListingReviewQuery>(
            HasActiveListingReviewDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "HasActiveListingReview",
        "query",
        variables,
      );
    },
    ClaimReviewNotifications(
      variables: ClaimReviewNotificationsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimReviewNotificationsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimReviewNotificationsMutation>(
            ClaimReviewNotificationsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimReviewNotifications",
        "mutation",
        variables,
      );
    },
    FetchReviewNotificationContext(
      variables: FetchReviewNotificationContextQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewNotificationContextQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewNotificationContextQuery>(
            FetchReviewNotificationContextDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewNotificationContext",
        "query",
        variables,
      );
    },
    CompleteReviewNotification(
      variables: CompleteReviewNotificationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CompleteReviewNotificationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CompleteReviewNotificationMutation>(
            CompleteReviewNotificationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CompleteReviewNotification",
        "mutation",
        variables,
      );
    },
    RetryReviewNotification(
      variables: RetryReviewNotificationMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RetryReviewNotificationMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RetryReviewNotificationMutation>(
            RetryReviewNotificationDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RetryReviewNotification",
        "mutation",
        variables,
      );
    },
    ClaimReviewSubmission(
      variables: ClaimReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimReviewSubmissionMutation>(
            ClaimReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimReviewSubmission",
        "mutation",
        variables,
      );
    },
    HeartbeatReviewSubmission(
      variables: HeartbeatReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<HeartbeatReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<HeartbeatReviewSubmissionMutation>(
            HeartbeatReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "HeartbeatReviewSubmission",
        "mutation",
        variables,
      );
    },
    ReleaseReviewSubmission(
      variables: ReleaseReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReleaseReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReleaseReviewSubmissionMutation>(
            ReleaseReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReleaseReviewSubmission",
        "mutation",
        variables,
      );
    },
    SaveReviewChecklist(
      variables: SaveReviewChecklistMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SaveReviewChecklistMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SaveReviewChecklistMutation>(
            SaveReviewChecklistDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "SaveReviewChecklist",
        "mutation",
        variables,
      );
    },
    EnqueueReviewAssetCleanup(
      variables: EnqueueReviewAssetCleanupMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<EnqueueReviewAssetCleanupMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<EnqueueReviewAssetCleanupMutation>(
            EnqueueReviewAssetCleanupDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "EnqueueReviewAssetCleanup",
        "mutation",
        variables,
      );
    },
    SettleReviewAssetCleanup(
      variables: SettleReviewAssetCleanupMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SettleReviewAssetCleanupMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SettleReviewAssetCleanupMutation>(
            SettleReviewAssetCleanupDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "SettleReviewAssetCleanup",
        "mutation",
        variables,
      );
    },
    DecideReviewSubmission(
      variables: DecideReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DecideReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DecideReviewSubmissionMutation>(
            DecideReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DecideReviewSubmission",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
