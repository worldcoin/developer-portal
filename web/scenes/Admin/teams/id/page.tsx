import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TeamAppsPanel } from "@/components/AdminDashboard/Teams/Detail/TeamAppsPanel";
import { TeamMembersPanel } from "@/components/AdminDashboard/Teams/Detail/TeamMembersPanel";
import { StatusBadge } from "@/components/AdminDashboard/Teams/StatusBadge";
import { TeamMetric } from "@/components/AdminDashboard/Teams/TeamMetric";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { parseAppsPage } from "@/components/AdminDashboard/Apps/pagination";
import { parseAppsSearchQuery } from "@/components/AdminDashboard/Apps/search";
import { parseUsersPage } from "@/components/AdminDashboard/Users/pagination";
import { parseUsersSearchQuery } from "@/components/AdminDashboard/Users/search";
import { fetchAdminTeamDetails } from "./server/fetch-team-details";

type AdminTeamPageProps = {
  searchParams?: Promise<{
    appsPage?: string | string[];
    appsQuery?: string | string[];
    membersPage?: string | string[];
    membersQuery?: string | string[];
  }>;
  teamId: string;
};

const PanelSkeleton = ({ label }: { label: string }) => (
  <UIModule className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-3 p-5">
    <h2 className="text-16 font-semibold text-grey-900">{label}</h2>
    <div className="h-9 animate-pulse rounded-12 bg-grey-100" />
    <div className="space-y-3">
      <div className="h-12 animate-pulse rounded-8 bg-grey-100" />
      <div className="h-12 animate-pulse rounded-8 bg-grey-100" />
      <div className="h-12 animate-pulse rounded-8 bg-grey-100" />
    </div>
  </UIModule>
);

export const AdminTeamPage = async ({
  searchParams = Promise.resolve({}),
  teamId,
}: AdminTeamPageProps) => {
  const params = await searchParams;
  const appsPage = parseAppsPage(params.appsPage);
  const appsQuery = parseAppsSearchQuery(params.appsQuery);
  const membersPage = parseUsersPage(params.membersPage);
  const membersQuery = parseUsersSearchQuery(params.membersQuery);
  const details = await fetchAdminTeamDetails(teamId);

  if (!details) {
    notFound();
  }

  const status = details.team.deleted_at ? "Deleted" : "Active";

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-2 text-12 font-medium tracking-wide text-grey-400 uppercase">
              Admin / Teams
            </div>
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              {details.team.name ?? "Unnamed team"}
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review team-level information, usage, and related resources.
            </p>
          </div>

          <div className="min-w-0 rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Team ID
            </div>
            <div className="mt-1 truncate font-mono text-13 font-medium text-grey-900">
              {teamId}
            </div>
            <div className="mt-3">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </UIModule>

      <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:grid-rows-2">
        <UIModule className="min-h-0 overflow-auto p-5 lg:row-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-16 font-semibold text-grey-900">Overview</h2>
            <Link
              className="text-12 font-medium text-blue-500 hover:text-blue-600"
              href="/admin/teams"
            >
              All teams
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <TeamMetric label="Members" value={details.membersCount} />
            <TeamMetric label="Apps" value={details.appsCount} />
            <TeamMetric
              label="Pending invites"
              value={details.pendingInvitesCount}
            />
            <TeamMetric
              label="Active API keys"
              value={details.activeApiKeysCount}
            />
          </dl>
          <dl className="mt-6 grid gap-2 text-14">
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Created</dt>
              <dd className="font-medium text-grey-900">
                {details.team.created_at.slice(0, 10)}
              </dd>
            </div>
          </dl>
          <section className="mt-6">
            <h3 className="text-14 font-semibold text-grey-900">API keys</h3>
            <div className="mt-2 divide-y divide-grey-100">
              {details.apiKeys.length === 0 ? (
                <p className="py-3 text-14 text-grey-500">No API keys.</p>
              ) : (
                details.apiKeys.map((apiKey) => (
                  <div
                    className="flex items-center justify-between gap-3 py-3"
                    key={apiKey.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-14 font-medium text-grey-900">
                        {apiKey.name}
                      </p>
                      <p className="truncate font-mono text-12 text-grey-400">
                        {apiKey.id}
                      </p>
                    </div>
                    <span className="shrink-0 text-12 text-grey-500">
                      {apiKey.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="mt-6">
            <h3 className="text-14 font-semibold text-grey-900">Invites</h3>
            <div className="mt-2 divide-y divide-grey-100">
              {details.invites.length === 0 ? (
                <p className="py-3 text-14 text-grey-500">No invites.</p>
              ) : (
                details.invites.map((invite) => (
                  <div
                    className="flex items-center justify-between gap-3 py-3"
                    key={invite.id}
                  >
                    <p className="truncate text-14 text-grey-900">
                      {invite.email}
                    </p>
                    <time className="shrink-0 text-12 text-grey-500">
                      {invite.expires_at.slice(0, 10)}
                    </time>
                  </div>
                ))
              )}
            </div>
          </section>
        </UIModule>
        <Suspense fallback={<PanelSkeleton label="Apps" />}>
          <TeamAppsPanel
            appsPage={appsPage}
            appsQuery={appsQuery}
            teamId={teamId}
          />
        </Suspense>
        <Suspense fallback={<PanelSkeleton label="Members" />}>
          <TeamMembersPanel
            membersPage={membersPage}
            membersQuery={membersQuery}
            teamId={teamId}
          />
        </Suspense>
      </div>
    </div>
  );
};
