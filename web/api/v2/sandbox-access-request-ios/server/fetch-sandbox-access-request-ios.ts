import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import "server-only";
import { getSdk } from "../graphql/get-sandbox-access-request-ios.generated";

type APIServiceGraphqlClient = Awaited<
  ReturnType<typeof getAPIServiceGraphqlClient>
>;

export type SandboxAccessRequestIosStatus = "pending" | "approved" | "rejected";

export type SandboxAccessRequestIosState = {
  ascEmail: string;
  status: SandboxAccessRequestIosStatus;
  createdAt: string;
  updatedAt: string;
};

const isSandboxAccessRequestIosStatus = (
  status: unknown,
): status is SandboxAccessRequestIosStatus =>
  status === "pending" || status === "approved" || status === "rejected";

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
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  };
};
