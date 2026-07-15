import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { UserAppsPanel } from "@/components/AdminDashboard/Users/Detail/UserAppsPanel";
import { UserTeamsPanel } from "@/components/AdminDashboard/Users/Detail/UserTeamsPanel";
import { UserMetric } from "@/components/AdminDashboard/Users/UserMetric";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { parseAppsPage } from "@/components/AdminDashboard/Apps/pagination";
import { parseAppsSearchQuery } from "@/components/AdminDashboard/Apps/search";
import { parseUsersPage } from "@/components/AdminDashboard/Users/pagination";
import { parseUsersSearchQuery } from "@/components/AdminDashboard/Users/search";
import { fetchAdminUserDetails } from "./server/fetch-user-details";

type AdminUserPageProps = {
  searchParams?: Promise<{
    appsPage?: string | string[];
    appsQuery?: string | string[];
    teamsPage?: string | string[];
    teamsQuery?: string | string[];
  }>;
  userId: string;
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

export const AdminUserPage = async ({
  searchParams = Promise.resolve({}),
  userId,
}: AdminUserPageProps) => {
  const params = await searchParams;
  const appsPage = parseAppsPage(params.appsPage);
  const appsQuery = parseAppsSearchQuery(params.appsQuery);
  const teamsPage = parseUsersPage(params.teamsPage);
  const teamsQuery = parseUsersSearchQuery(params.teamsQuery);
  const details = await fetchAdminUserDetails(userId);

  if (!details) {
    notFound();
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-2 text-12 font-medium tracking-wide text-grey-400 uppercase">
              Admin / Users
            </div>
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              {details.user.name || "Unnamed user"}
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review user-level information and related resources.
            </p>
          </div>

          <div className="min-w-0 rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              User ID
            </div>
            <div className="mt-1 truncate font-mono text-13 font-medium text-grey-900">
              {userId}
            </div>
            <div className="mt-3 truncate text-12 text-grey-500">
              {details.user.email ?? "No email"}
            </div>
            <div className="mt-1 text-12 text-grey-500">
              Created {details.user.created_at.slice(0, 10)}
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
              href="/admin/users"
            >
              All users
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <UserMetric label="Teams" value={details.teamsCount} />
            <UserMetric label="Owner" value={details.ownerCount} />
            <UserMetric label="Admin" value={details.adminCount} />
            <UserMetric label="Active apps" value={details.activeAppsCount} />
          </dl>
          <dl className="mt-6 grid gap-2 text-14">
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Email</dt>
              <dd className="truncate font-medium text-grey-900">
                {details.user.email ?? "No email"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Created</dt>
              <dd className="font-medium text-grey-900">
                {details.user.created_at.slice(0, 10)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Member roles</dt>
              <dd className="font-medium text-grey-900">
                {details.memberCount}
              </dd>
            </div>
          </dl>
          {details.soleOwnerTeams.length > 0 && (
            <section className="mt-6">
              <h3 className="text-14 font-semibold text-grey-900">
                Sole owner teams
              </h3>
              <p className="mt-1 text-12 text-grey-500">
                Removing this user could leave these teams without an owner.
              </p>
              <div className="mt-2 divide-y divide-grey-100">
                {details.soleOwnerTeams.map((team) => (
                  <Link
                    className="block py-3 text-14 font-medium text-blue-500 hover:text-blue-600"
                    href={`/admin/teams/${team.id}`}
                    key={team.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {team.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {details.deletedTeams.length > 0 && (
            <section className="mt-6">
              <h3 className="text-14 font-semibold text-grey-900">
                Deleted teams
              </h3>
              <div className="mt-2 divide-y divide-grey-100">
                {details.deletedTeams.map((team) => (
                  <Link
                    className="block py-3 text-14 font-medium text-blue-500 hover:text-blue-600"
                    href={`/admin/teams/${team.id}`}
                    key={team.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {team.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </UIModule>
        <Suspense fallback={<PanelSkeleton label="Teams" />}>
          <UserTeamsPanel
            teamsPage={teamsPage}
            teamsQuery={teamsQuery}
            userId={userId}
          />
        </Suspense>
        <Suspense fallback={<PanelSkeleton label="Apps in user’s teams" />}>
          <UserAppsPanel
            appsPage={appsPage}
            appsQuery={appsQuery}
            userId={userId}
          />
        </Suspense>
      </div>
    </div>
  );
};
