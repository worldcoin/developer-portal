import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import {
  type FetchAdminHomeQuery,
  getSdk,
} from "../graphql/server/fetch-admin-home.generated";

export type AdminMetadataStatus =
  | "awaiting_review"
  | "changes_requested"
  | "unverified"
  | "verified";

type HomeWorkflowApp = FetchAdminHomeQuery["workflow_apps"][number];
type WorkflowStatusSource = {
  draft_metadata: ReadonlyArray<{ verification_status: string }>;
  verified_metadata: ReadonlyArray<{ verification_status: string }>;
};

const metadataStatuses = new Set<AdminMetadataStatus>([
  "awaiting_review",
  "changes_requested",
  "unverified",
  "verified",
]);

const getCount = (aggregate: { aggregate?: { count: number } | null }) =>
  aggregate.aggregate?.count ?? 0;

export const getWorkflowStatus = (
  app: WorkflowStatusSource,
): AdminMetadataStatus | null => {
  const status =
    app.draft_metadata[0]?.verification_status ??
    app.verified_metadata[0]?.verification_status;

  return status && metadataStatuses.has(status as AdminMetadataStatus)
    ? (status as AdminMetadataStatus)
    : null;
};

const mapWorkflowApp = (app: HomeWorkflowApp) => ({
  id: app.id,
  name:
    app.draft_metadata[0]?.name ?? app.verified_metadata[0]?.name ?? app.name,
  status: getWorkflowStatus(app),
  teamId: app.team_id,
  updatedAt: app.draft_metadata[0]?.updated_at ?? null,
});

export const fetchAdminHome = async () => {
  const client = await getInternalDashboardGraphqlClient();
  const recentSince = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const data = await getSdk(client).FetchAdminHome({
      recentLimit: 5,
      recentSince,
    });
    const workflowApps = data.workflow_apps.map(mapWorkflowApp);
    const soleOwnerTeams = data.owner_memberships
      .filter(
        (membership) =>
          membership.team.memberships_aggregate.aggregate?.count === 1,
      )
      .map((membership) => ({
        id: membership.team.id,
        name: membership.team.name ?? "Unnamed team",
        owner: {
          email: membership.user.email,
          id: membership.user.id,
          name: membership.user.name,
        },
      }));

    return {
      inventory: {
        activeApiKeys: getCount(data.active_api_keys),
        activeApps: getCount(data.active_apps),
        activeTeams: getCount(data.active_teams),
        deletedApps: getCount(data.deleted_apps),
        deletedTeams: getCount(data.deleted_teams),
        newApps: getCount(data.new_apps),
        newTeams: getCount(data.new_teams),
        newUsers: getCount(data.new_users),
        pendingInvites: getCount(data.pending_invites),
        totalUsers: getCount(data.total_users),
      },
      queues: {
        appsAwaitingReview: workflowApps.filter(
          (app) => app.status === "awaiting_review",
        ),
        appsChangesRequested: workflowApps.filter(
          (app) => app.status === "changes_requested",
        ),
        appsWithoutMetadata: data.apps_without_metadata.map((app) => ({
          id: app.id,
          name: app.name,
          teamId: app.team_id,
        })),
        soleOwnerTeams,
        teamsWithoutOwner: data.teams_without_owner.map((team) => ({
          id: team.id,
          name: team.name ?? "Unnamed team",
        })),
        usersWithoutTeams: data.users_without_teams.map((user) => ({
          email: user.email,
          id: user.id,
          name: user.name,
        })),
      },
      recent: {
        apps: data.recent_apps.map((app) => ({
          createdAt: app.created_at,
          id: app.id,
          name: app.name,
          status: getWorkflowStatus(app),
          teamId: app.team_id,
        })),
        metadata: data.recent_metadata.map((metadata) => ({
          appId: metadata.app_id,
          name: metadata.name,
          status: metadataStatuses.has(
            metadata.verification_status as AdminMetadataStatus,
          )
            ? (metadata.verification_status as AdminMetadataStatus)
            : null,
          updatedAt: metadata.updated_at,
        })),
        teams: data.recent_teams.map((team) => ({
          createdAt: team.created_at,
          id: team.id,
          name: team.name ?? "Unnamed team",
          status: team.deleted_at ? ("Deleted" as const) : ("Active" as const),
        })),
        users: data.recent_users.map((user) => ({
          createdAt: user.created_at,
          email: user.email,
          id: user.id,
          name: user.name,
        })),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch admin home", { error });
    throw error;
  }
};
