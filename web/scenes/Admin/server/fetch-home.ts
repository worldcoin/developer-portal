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

type RecentWorkflowApp = FetchAdminHomeQuery["recent_apps"][number];
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

// Hasura returns bigint as string when STRINGIFY_NUMERIC_TYPES=true.
const toCount = (value: number | string | null | undefined): number => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
};

const getQueueCount = <Row extends { total_count: number | string }>(
  rows: ReadonlyArray<Row>,
) => toCount(rows[0]?.total_count);

const getRequiredValue = <Value>(
  value: Value | null | undefined,
  field: string,
): Value => {
  if (value === null || value === undefined) {
    throw new Error(`admin_dashboard_queues returned no ${field}`);
  }

  return value;
};

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

const mapRecentWorkflowApp = (app: RecentWorkflowApp) => ({
  createdAt: app.created_at,
  id: app.id,
  name: app.name,
  status: getWorkflowStatus(app),
  teamId: app.team_id,
});

export const fetchAdminHome = async () => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminHome({ recentLimit: 5 });
    const inventory = data.inventory[0];

    if (!inventory) {
      throw new Error("admin_dashboard_inventory returned no rows");
    }

    const getQueueRows = (kind: string) =>
      data.queues.filter((queue) => queue.kind === kind);
    const appsAwaitingReview = getQueueRows("apps_awaiting_review");
    const appsChangesRequested = getQueueRows("apps_changes_requested");
    const appsWithoutMetadata = getQueueRows("apps_without_metadata");
    const teamsWithoutOwner = getQueueRows("teams_without_owner");
    const soleOwnerTeams = getQueueRows("sole_owner_teams");
    const usersWithoutTeams = getQueueRows("users_without_teams");

    return {
      inventory: {
        activeApiKeys: toCount(inventory.active_api_keys),
        activeApps: toCount(inventory.active_apps),
        activeTeams: toCount(inventory.active_teams),
        deletedApps: toCount(inventory.deleted_apps),
        deletedTeams: toCount(inventory.deleted_teams),
        newApps: toCount(inventory.new_apps),
        newTeams: toCount(inventory.new_teams),
        newUsers: toCount(inventory.new_users),
        pendingInvites: toCount(inventory.pending_invites),
        totalUsers: toCount(inventory.total_users),
      },
      queues: {
        appsAwaitingReview: appsAwaitingReview.map((app) => ({
          id: app.id,
          name: app.name ?? "Unnamed app",
          teamId: getRequiredValue(app.team_id, "team_id"),
          updatedAt: app.updated_at ?? null,
        })),
        appsChangesRequested: appsChangesRequested.map((app) => ({
          id: app.id,
          name: app.name ?? "Unnamed app",
          teamId: getRequiredValue(app.team_id, "team_id"),
          updatedAt: app.updated_at ?? null,
        })),
        appsWithoutMetadata: appsWithoutMetadata.map((app) => ({
          id: app.id,
          name: app.name ?? "Unnamed app",
          teamId: getRequiredValue(app.team_id, "team_id"),
        })),
        soleOwnerTeams: soleOwnerTeams.map((team) => ({
          id: team.id,
          name: team.name ?? "Unnamed team",
          owner: {
            email: team.owner_email,
            id: getRequiredValue(team.owner_id, "owner_id"),
            name: team.owner_name ?? "Unnamed user",
          },
        })),
        teamsWithoutOwner: teamsWithoutOwner.map((team) => ({
          id: team.id,
          name: team.name ?? "Unnamed team",
        })),
        usersWithoutTeams: usersWithoutTeams.map((user) => ({
          email: user.email,
          id: user.id,
          name: user.name ?? "Unnamed user",
        })),
      },
      queueCounts: {
        appsAwaitingReview: getQueueCount(appsAwaitingReview),
        appsChangesRequested: getQueueCount(appsChangesRequested),
        appsWithoutMetadata: getQueueCount(appsWithoutMetadata),
        soleOwnerTeams: getQueueCount(soleOwnerTeams),
        teamsWithoutOwner: getQueueCount(teamsWithoutOwner),
        usersWithoutTeams: getQueueCount(usersWithoutTeams),
      },
      recent: {
        apps: data.recent_apps.map(mapRecentWorkflowApp),
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
          name: user.name ?? "Unnamed user",
        })),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch admin home", { error });
    throw error;
  }
};
