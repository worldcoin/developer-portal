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
}>;

export type CaptureListingReviewSubmissionMutation = {
  __typename?: "mutation_root";
  capture_listing_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    app_metadata_id: string;
    attempt: number;
    status: string;
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
      }
    ) {
      id
      app_metadata_id
      attempt
      status
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
  };
}
export type Sdk = ReturnType<typeof getSdk>;
