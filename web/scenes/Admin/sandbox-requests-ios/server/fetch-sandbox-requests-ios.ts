import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { getSdk } from "../graphql/server/fetch-sandbox-access-requests-ios.generated";

export type SandboxAccessRequestIosStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

export type SandboxAccessRequestIosRow = {
  id: string;
  ascEmail: string;
  portalEmail: string;
  teamId: string;
  status: SandboxAccessRequestIosStatus;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
};

const isSandboxAccessRequestIosStatus = (
  status: unknown,
): status is SandboxAccessRequestIosStatus =>
  status === "pending" ||
  status === "approved" ||
  status === "rejected" ||
  status === "revoked";

export const fetchSandboxAccessRequestsIos = async (): Promise<{
  requests: SandboxAccessRequestIosRow[];
  totalCount: number;
  pendingCount: number;
}> => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchSandboxAccessRequestsIos();

    return {
      requests: data.sandbox_access_request_ios.map((request) => {
        if (!isSandboxAccessRequestIosStatus(request.status)) {
          throw new Error(
            `Unexpected iOS sandbox request status: ${String(request.status)}`,
          );
        }

        return {
          id: request.id,
          ascEmail: request.asc_email,
          portalEmail: request.portal_email,
          teamId: request.team_id,
          status: request.status,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          revokedAt: request.revoked_at ?? null,
          revokedBy: request.revoked_by ?? null,
        };
      }),
      totalCount: data.total.aggregate?.count ?? 0,
      pendingCount: data.pending.aggregate?.count ?? 0,
    };
  } catch (error) {
    logger.error("Failed to fetch iOS sandbox access requests for admin", {
      error,
    });
    throw error;
  }
};
