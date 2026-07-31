import { AppStatus, type StatusVariant } from "@/components/AppStatus";
import { StatusBadge } from "@/components/AdminDashboard/Teams/StatusBadge";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import Link from "next/link";

import { fetchAdminHome, type AdminMetadataStatus } from "./server/fetch-home";

const formatDate = (value: string) => value.slice(0, 10);

const isAppStatus = (
  status: AdminMetadataStatus | null,
): status is StatusVariant => Boolean(status);

type MetricCardProps = {
  detail: string;
  href: string;
  label: string;
  value: number;
};

const MetricCard = ({ detail, href, label, value }: MetricCardProps) => (
  <Link
    className="rounded-12 border border-grey-200 bg-grey-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"
    href={href}
  >
    <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
      {label}
    </div>
    <div className="mt-2 text-24 font-semibold tracking-[-0.02em] text-grey-900">
      {value}
    </div>
    <div className="mt-1 text-12 text-grey-500">{detail}</div>
  </Link>
);

type QueueSectionProps = {
  children: React.ReactNode;
  count: number;
  href: string;
  title: string;
};

const QueueSection = ({ children, count, href, title }: QueueSectionProps) => (
  <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
    <Link
      className="flex items-center justify-between gap-3 rounded-8 outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
      href={href}
    >
      <h3 className="text-14 font-semibold text-grey-900">{title}</h3>
      <span className="rounded-full border border-grey-200 bg-grey-0 px-2.5 py-1 text-12 font-semibold text-grey-700">
        {count}
      </span>
    </Link>
    {count === 0 ? (
      <p className="mt-2 text-13 text-grey-500">Nothing needs attention.</p>
    ) : (
      <div className="mt-2 divide-y divide-grey-200">{children}</div>
    )}
  </section>
);

const EntityLink = ({
  detail,
  href,
  label,
}: {
  detail?: string | null;
  href: string;
  label: string;
}) => (
  <Link
    className="flex min-w-0 items-center justify-between gap-3 rounded-8 px-2 py-2.5 text-13 transition-colors outline-none hover:bg-grey-0 focus-visible:ring-2 focus-visible:ring-blue-500"
    href={href}
  >
    <span className="truncate font-medium text-grey-900 hover:text-blue-600">
      {label}
    </span>
    {detail && <span className="shrink-0 text-12 text-grey-500">{detail}</span>}
  </Link>
);

const RecentSectionHeader = ({
  href,
  title,
}: {
  href: string;
  title: string;
}) => (
  <Link
    className="text-grey-600 text-12 font-semibold tracking-[0.08em] uppercase outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
    href={href}
  >
    {title}
  </Link>
);

export const AdminPage = async () => {
  const home = await fetchAdminHome();

  return (
    <div className="grid min-h-0 max-lg:h-auto grid-rows-[auto_minmax(0,1fr)] gap-4 lg:h-full">
      <UIModule className="min-h-0 max-lg:overflow-visible p-5 lg:overflow-y-auto">
        <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
          Internal dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-14 text-grey-500">
          Monitor Developer Portal data and investigate operational issues.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${home.inventory.newTeams} new in 30 days`}
            href="/admin/teams"
            label="Active teams"
            value={home.inventory.activeTeams}
          />
          <MetricCard
            detail={`${home.inventory.newApps} new in 30 days`}
            href="/admin/apps"
            label="Active apps"
            value={home.inventory.activeApps}
          />
          <MetricCard
            detail={`${home.inventory.newUsers} new in 30 days`}
            href="/admin/users"
            label="Users"
            value={home.inventory.totalUsers}
          />
          <MetricCard
            detail={`${home.inventory.sandboxTotal} total`}
            href="/admin/sandbox-requests"
            label="Sandbox requests"
            value={home.inventory.sandboxPending}
          />
        </div>
      </UIModule>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <UIModule className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] max-lg:overflow-visible p-5 lg:overflow-hidden">
          <div>
            <h2 className="text-16 font-semibold text-grey-900">
              Needs attention
            </h2>
            <p className="mt-1 text-13 text-grey-500">
              Data states that may need support or operational follow-up.
            </p>
          </div>
          <div className="mt-4 grid min-h-0 gap-3 max-lg:overflow-visible pr-1 lg:overflow-y-auto">
            <QueueSection
              count={home.queueCounts.appsAwaitingReview}
              href="/admin/apps?query=review%3Aawaiting_review"
              title="Apps in review"
            >
              {home.queues.appsAwaitingReview.map((app) => (
                <EntityLink
                  detail={app.updatedAt ? formatDate(app.updatedAt) : undefined}
                  href={`/admin/apps/${app.id}`}
                  key={app.id}
                  label={app.name}
                />
              ))}
            </QueueSection>
            <QueueSection
              count={home.queueCounts.appsChangesRequested}
              href="/admin/apps?query=review%3Achanges_requested"
              title="Apps with changes requested"
            >
              {home.queues.appsChangesRequested.map((app) => (
                <EntityLink
                  detail={app.updatedAt ? formatDate(app.updatedAt) : undefined}
                  href={`/admin/apps/${app.id}`}
                  key={app.id}
                  label={app.name}
                />
              ))}
            </QueueSection>
            <QueueSection
              count={home.queueCounts.appsWithoutMetadata}
              href="/admin/apps?query=metadata%3Anone"
              title="Apps without metadata"
            >
              {home.queues.appsWithoutMetadata.map((app) => (
                <EntityLink
                  detail={app.teamId}
                  href={`/admin/apps/${app.id}`}
                  key={app.id}
                  label={app.name}
                />
              ))}
            </QueueSection>
            <QueueSection
              count={home.queueCounts.teamsWithoutOwner}
              href="/admin/teams?query=owners%3A0%20status%3Aactive"
              title="Teams without an owner"
            >
              {home.queues.teamsWithoutOwner.map((team) => (
                <EntityLink
                  href={`/admin/teams/${team.id}`}
                  key={team.id}
                  label={team.name}
                />
              ))}
            </QueueSection>
            <QueueSection
              count={home.queueCounts.soleOwnerTeams}
              href="/admin/teams?query=owners%3A1%20status%3Aactive"
              title="Teams with one owner"
            >
              {home.queues.soleOwnerTeams.map((team) => (
                <EntityLink
                  detail={team.owner.name}
                  href={`/admin/teams/${team.id}`}
                  key={team.id}
                  label={team.name}
                />
              ))}
            </QueueSection>
            <QueueSection
              count={home.queueCounts.usersWithoutTeams}
              href="/admin/users?query=teams%3A0"
              title="Users without a team"
            >
              {home.queues.usersWithoutTeams.map((user) => (
                <EntityLink
                  detail={user.email}
                  href={`/admin/users/${user.id}`}
                  key={user.id}
                  label={user.name}
                />
              ))}
            </QueueSection>
          </div>
        </UIModule>

        <UIModule className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] max-lg:overflow-visible p-5 lg:overflow-hidden">
          <div>
            <h2 className="text-16 font-semibold text-grey-900">
              Recent changes
            </h2>
            <p className="mt-1 text-13 text-grey-500">
              Newly created entities and the latest metadata updates.
            </p>
          </div>
          <div className="mt-4 grid min-h-0 gap-3 max-lg:overflow-visible pr-1 lg:overflow-y-auto">
            <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
              <RecentSectionHeader
                href="/admin/apps?sort=createdAt%3Adesc"
                title="Apps"
              />
              <div className="mt-1 divide-y divide-grey-100">
                {home.recent.apps.map((app) => (
                  <Link
                    className="flex items-center justify-between gap-3 py-2 outline-none hover:text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                    href={`/admin/apps/${app.id}`}
                    key={app.id}
                  >
                    <span className="min-w-0 truncate text-13 font-medium text-grey-900">
                      {app.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {isAppStatus(app.status) && (
                        <AppStatus
                          className="px-2 py-0.5"
                          status={app.status}
                        />
                      )}
                      <time className="text-12 text-grey-500">
                        {formatDate(app.createdAt)}
                      </time>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
              <RecentSectionHeader
                href="/admin/teams?sort=createdAt%3Adesc"
                title="Teams"
              />
              <div className="mt-1 divide-y divide-grey-100">
                {home.recent.teams.map((team) => (
                  <Link
                    className="flex items-center justify-between gap-3 py-2 outline-none hover:text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                    href={`/admin/teams/${team.id}`}
                    key={team.id}
                  >
                    <span className="min-w-0 truncate text-13 font-medium text-grey-900">
                      {team.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={team.status} />
                      <time className="text-12 text-grey-500">
                        {formatDate(team.createdAt)}
                      </time>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
              <RecentSectionHeader
                href="/admin/users?sort=createdAt%3Adesc"
                title="Users"
              />
              <div className="mt-1 divide-y divide-grey-100">
                {home.recent.users.map((user) => (
                  <EntityLink
                    detail={formatDate(user.createdAt)}
                    href={`/admin/users/${user.id}`}
                    key={user.id}
                    label={user.name}
                  />
                ))}
              </div>
            </section>
            <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
              <h3 className="text-grey-600 text-12 font-semibold tracking-[0.08em] uppercase">
                Metadata updates
              </h3>
              <div className="mt-1 divide-y divide-grey-100">
                {home.recent.metadata.map((metadata) => (
                  <Link
                    className="flex items-center justify-between gap-3 py-2 outline-none hover:text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                    href={`/admin/apps/${metadata.appId}`}
                    key={`${metadata.appId}:${metadata.updatedAt}`}
                  >
                    <span className="min-w-0 truncate text-13 font-medium text-grey-900">
                      {metadata.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {isAppStatus(metadata.status) && (
                        <AppStatus
                          className="px-2 py-0.5"
                          status={metadata.status}
                        />
                      )}
                      <time className="text-12 text-grey-500">
                        {formatDate(metadata.updatedAt)}
                      </time>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </UIModule>
      </div>
    </div>
  );
};
