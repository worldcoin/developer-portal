import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import "server-only";
import { getSdk } from "../graphql/get-sandbox-access-request.generated";

type APIServiceGraphqlClient = Awaited<
  ReturnType<typeof getAPIServiceGraphqlClient>
>;

export type SandboxAccessRequestState = {
  email: string;
  accepted: boolean;
  createdAt: string;
};

export const fetchSandboxAccessRequest = async (
  userId: string,
  client?: APIServiceGraphqlClient,
): Promise<SandboxAccessRequestState | null> => {
  const graphqlClient = client ?? (await getAPIServiceGraphqlClient());
  const data = await getSdk(graphqlClient).GetSandboxAccessRequest({
    user_id: userId,
  });
  const request = data.sandbox_access_request[0];

  return request
    ? {
        email: request.google_email,
        accepted: request.accepted,
        createdAt: request.created_at,
      }
    : null;
};
