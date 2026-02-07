import { gql, useMutation } from "@apollo/client";

export type RetryRpMutationVariables = {
  rp_id: string;
  environment: "production" | "staging";
};

export type RetryRpMutationData = {
  retry_rp: {
    success: boolean;
    environment: string;
    operation_hash?: string | null;
  } | null;
};

export const RetryRpDocument = gql`
  mutation RetryRp($rp_id: String!, $environment: String!) {
    retry_rp(rp_id: $rp_id, environment: $environment) {
      success
      environment
      operation_hash
    }
  }
`;

export const useRetryRpMutation = () =>
  useMutation<RetryRpMutationData, RetryRpMutationVariables>(RetryRpDocument);
