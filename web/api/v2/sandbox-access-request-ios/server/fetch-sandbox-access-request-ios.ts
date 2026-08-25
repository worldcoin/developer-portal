import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import "server-only";
import { getSdk } from "../graphql/get-sandbox-access-request-ios.generated";

type APIServiceGraphqlClient = Awaited<
  ReturnType<typeof getAPIServiceGraphqlClient>
>;

export type SandboxAccessRequestIosStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

type StoredSandboxAccessRequestIosStatus =
  | SandboxAccessRequestIosStatus
  | "approving"
  | "revoking";

export type SandboxAccessRequestIosState = {
  ascEmail: string;
  status: SandboxAccessRequestIosStatus;
};

const isSandboxAccessRequestIosStatus = (
  status: unknown,
): status is StoredSandboxAccessRequestIosStatus =>
  status === "pending" ||
  status === "approving" ||
  status === "approved" ||
  status === "rejected" ||
  status === "revoking" ||
  status === "revoked";

export const fetchSandboxAccessRequestIos = async (
  userId: string,
  client?: APIServiceGraphqlClient,
): Promise<SandboxAccessRequestIosState | null> => {
  const graphqlClient = client ?? (await getAPIServiceGraphqlClient());
  const data = await getSdk(graphqlClient).GetSandboxAccessRequestIos({
    user_id: userId,
  });
  const request = data.sandbox_access_request_ios[0];

  if (!request) {
    return null;
  }

  if (!isSandboxAccessRequestIosStatus(request.status)) {
    throw new Error(`Unexpected iOS sandbox request status: ${request.status}`);
  }

  return {
    ascEmail: request.asc_email,
    // Processing states stay represented by their pre-operation public state
    // until App Store Connect confirms the change.
    status:
      request.status === "revoking"
        ? "approved"
        : request.status === "approving"
          ? "pending"
          : request.status,
  };
};
