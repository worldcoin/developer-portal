import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { getSdk } from "../graphql/server/fetch-sandbox-access-requests.generated";

export type SandboxAccessRequestRow = {
  id: string;
  googleEmail: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  accepted: boolean;
  createdAt: string;
  processedAt: string | null;
};

export const fetchSandboxAccessRequests = async (): Promise<{
  requests: SandboxAccessRequestRow[];
  totalCount: number;
  pendingCount: number;
}> => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchSandboxAccessRequests();

    return {
      requests: data.sandbox_access_request.map((request) => ({
        id: request.id,
        googleEmail: request.google_email,
        userId: request.user_id,
        userName: request.user?.name ?? null,
        userEmail: request.user?.email ?? null,
        accepted: request.accepted,
        createdAt: request.created_at,
        processedAt: request.processed_at ?? null,
      })),
      totalCount: data.total.aggregate?.count ?? 0,
      pendingCount: data.pending.aggregate?.count ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch sandbox access requests for admin", {
      error,
    });
    throw error;
  }
};
