/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type CaptureListingReviewSubmissionMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  changelog: Types.Scalars["String"]["input"];
  submitted_by_subject?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  submitted_by_email?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  listing_consent: Types.Scalars["Boolean"]["input"];
  expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
  expected_localizations_snapshot: Types.Scalars["jsonb"]["input"];
  asset_snapshot: Types.Scalars["jsonb"]["input"];
}>;

export type CaptureListingReviewSubmissionMutation = {
  __typename?: "mutation_root";
  capture_listing_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    app_metadata_id: string;
    attempt: number;
    status: string;
    review_version: number;
    metadata_updated_at: string;
  }>;
};

export type ReconcileListingReviewSubmissionCaptureMutationVariables =
  Types.Exact<{
    app_metadata_id: Types.Scalars["String"]["input"];
    asset_snapshot: Types.Scalars["jsonb"]["input"];
  }>;

export type ReconcileListingReviewSubmissionCaptureMutation = {
  __typename?: "mutation_root";
  reconcile_listing_review_submission_capture: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    app_metadata_id: string;
    attempt: number;
    status: string;
    review_version: number;
    metadata_updated_at: string;
  }>;
};

export const CaptureListingReviewSubmissionDocument = gql`
  mutation CaptureListingReviewSubmission(
    $app_metadata_id: String!
    $changelog: String!
    $submitted_by_subject: String
    $submitted_by_email: String
    $listing_consent: Boolean!
    $expected_metadata_updated_at: timestamptz!
    $expected_localizations_snapshot: jsonb!
    $asset_snapshot: jsonb!
  ) {
    capture_listing_review_submission(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_changelog: $changelog
        p_submitted_by_subject: $submitted_by_subject
        p_submitted_by_email: $submitted_by_email
        p_listing_consent: $listing_consent
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_expected_localizations_snapshot: $expected_localizations_snapshot
        p_asset_snapshot: $asset_snapshot
      }
    ) {
      id
      app_metadata_id
      attempt
      status
      review_version
      metadata_updated_at
    }
  }
`;
export const ReconcileListingReviewSubmissionCaptureDocument = gql`
  mutation ReconcileListingReviewSubmissionCapture(
    $app_metadata_id: String!
    $asset_snapshot: jsonb!
  ) {
    reconcile_listing_review_submission_capture(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_asset_snapshot: $asset_snapshot
      }
    ) {
      id
      app_metadata_id
      attempt
      status
      review_version
      metadata_updated_at
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
    CaptureListingReviewSubmission(
      variables: CaptureListingReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<CaptureListingReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CaptureListingReviewSubmissionMutation>(
            CaptureListingReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "CaptureListingReviewSubmission",
        "mutation",
        variables,
      );
    },
    ReconcileListingReviewSubmissionCapture(
      variables: ReconcileListingReviewSubmissionCaptureMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReconcileListingReviewSubmissionCaptureMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReconcileListingReviewSubmissionCaptureMutation>(
            ReconcileListingReviewSubmissionCaptureDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReconcileListingReviewSubmissionCapture",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
