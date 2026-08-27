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
    app: {
      __typename?: "app";
      name: string;
      actions: Array<{
        __typename?: "action";
        id: string;
        action: string;
        app_flow_on_complete?: unknown | null;
        creation_mode: string;
        description: string;
        kiosk_enabled: boolean;
        max_accounts_per_user: number;
        max_verifications: number;
        name: string;
        post_action_deep_link_android?: string | null;
        post_action_deep_link_ios?: string | null;
        privacy_policy_uri?: string | null;
        status: string;
        terms_uri?: string | null;
        webhook_uri?: string | null;
      }>;
      rp_registration: Array<{
        __typename?: "rp_registration";
        rp_id: string;
        mode: unknown;
        signer_address?: string | null;
        staging_status?: unknown | null;
        status: unknown;
        actions_v4: Array<{
          __typename?: "action_v4";
          id: string;
          action: string;
          description: string;
          environment: unknown;
        }>;
      }>;
    };
    team: { __typename?: "team"; id: string; name?: string | null };
    events: Array<{
      __typename?: "app_review_event";
      id: unknown;
      event_type: string;
      event_sequence: number;
      actor_email?: string | null;
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
      last_error?: string | null;
      notification_type: string;
      recipient?: string | null;
      status: string;
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
      app {
        name
        actions(order_by: { created_at: desc }) {
          id
          action
          app_flow_on_complete
          creation_mode
          description
          kiosk_enabled
          max_accounts_per_user
          max_verifications
          name
          post_action_deep_link_android
          post_action_deep_link_ios
          privacy_policy_uri
          status
          terms_uri
          webhook_uri
        }
        rp_registration(order_by: { created_at: desc }) {
          rp_id
          mode
          signer_address
          staging_status
          status
          actions_v4(order_by: { created_at: desc }) {
            id
            action
            description
            environment
          }
        }
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
        created_at
        payload
        review_version
      }
      notifications(order_by: [{ created_at: desc }, { id: desc }]) {
        id
        attempt_count
        channel
        created_at
        last_error
        notification_type
        recipient
        status
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
