import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { getSdk } from "../graphql/server/fetch-sandbox-access-requests-ios.generated";

export type SandboxAccessRequestIosStatus =
  | "pending"
  | "approving"
  | "approved"
  | "rejected"
  | "revoking"
  | "revoked";

export type SandboxAccessRequestIosRow = {
  id: string;
  ascEmail: string;
  portalEmail: string;
  userName: string | null;
  teamId: string;
  teamName: string | null;
  status: SandboxAccessRequestIosStatus;
  createdAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  revokedAt: string | null;
};

const isSandboxAccessRequestIosStatus = (
  status: unknown,
): status is SandboxAccessRequestIosStatus =>
  status === "pending" ||
  status === "approving" ||
  status === "approved" ||
  status === "rejected" ||
  status === "revoking" ||
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
          userName: request.user?.name ?? null,
          teamId: request.team_id,
          teamName: request.team?.name ?? null,
          status: request.status,
          createdAt: request.created_at,
          approvedAt: request.approved_at ?? null,
          rejectionReason: request.rejection_reason ?? null,
          revokedAt: request.revoked_at ?? null,
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
