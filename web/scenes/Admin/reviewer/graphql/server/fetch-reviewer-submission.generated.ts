/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchReviewerSubmissionQueryVariables = Types.Exact<{
  reviewId: Types.Scalars["uuid"]["input"];
}>;

export type FetchReviewerSubmissionQuery = {
  __typename?: "query_root";
  app_review_submission_by_pk?: {
    __typename?: "app_review_submission";
    id: unknown;
    app_id: string;
    app_metadata_id: string;
    app_mode: string;
    asset_snapshot?: any | null;
    asset_snapshot_repair_attempt_count: number;
    asset_snapshot_repair_dead_lettered_at?: string | null;
    asset_snapshot_repair_last_error?: string | null;
    asset_snapshot_repair_next_at?: string | null;
    attempt: number;
    changelog: string;
    checklist: any;
    checklist_version?: string | null;
    claimed_at?: string | null;
    claimed_by_email?: string | null;
    claim_expires_at?: string | null;
    completed_at?: string | null;
    decided_at?: string | null;
    decided_by_email?: string | null;
    decision_summary?: string | null;
    listing_consent: boolean;
    listing_target: string;
    localizations_snapshot: any;
    metadata_snapshot: any;
    metadata_updated_at: string;
    review_version: number;
    status: string;
    submitted_at: string;
    world_id_configuration_snapshot: any;
    app: { __typename?: "app"; name: string };
    team: { __typename?: "team"; id: string; name?: string | null };
    events: Array<{
      __typename?: "app_review_event";
      id: unknown;
      event_type: string;
      event_sequence: number;
      actor_email?: string | null;
      actor_subject?: string | null;
      created_at: string;
      payload: any;
      review_version?: number | null;
    }>;
    notifications: Array<{
      __typename?: "app_review_notification";
      id: unknown;
      attempt_count: number;
      channel: string;
      created_at: string;
      delivered_at?: string | null;
      last_attempt_at?: string | null;
      last_error?: string | null;
      manual_retry_blocked: boolean;
      next_attempt_at: string;
      notification_type: string;
      provider_message_id?: string | null;
      recipient?: string | null;
      status: string;
      updated_at: string;
    }>;
  } | null;
};

export const FetchReviewerSubmissionDocument = gql`
  query FetchReviewerSubmission($reviewId: uuid!) {
    app_review_submission_by_pk(id: $reviewId) {
      id
      app_id
      app_metadata_id
      app_mode
      asset_snapshot
      asset_snapshot_repair_attempt_count
      asset_snapshot_repair_dead_lettered_at
      asset_snapshot_repair_last_error
      asset_snapshot_repair_next_at
      attempt
      changelog
      checklist
      checklist_version
      claimed_at
      claimed_by_email
      claim_expires_at
      completed_at
      decided_at
      decided_by_email
      decision_summary
      listing_consent
      listing_target
      localizations_snapshot
      metadata_snapshot
      metadata_updated_at
      review_version
      status
      submitted_at
      world_id_configuration_snapshot
      app {
        name
      }
      team {
        id
        name
      }
      events(order_by: [{ event_sequence: desc }, { id: desc }]) {
        id
        event_type
        event_sequence
        actor_email
        actor_subject
        created_at
        payload
        review_version
      }
      notifications(order_by: [{ created_at: desc }, { id: desc }]) {
        id
        attempt_count
        channel
        created_at
        delivered_at
        last_attempt_at
        last_error
        manual_retry_blocked
        next_attempt_at
        notification_type
        provider_message_id
        recipient
        status
        updated_at
      }
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
    FetchReviewerSubmission(
      variables: FetchReviewerSubmissionQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewerSubmissionQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewerSubmissionQuery>(
            FetchReviewerSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewerSubmission",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
