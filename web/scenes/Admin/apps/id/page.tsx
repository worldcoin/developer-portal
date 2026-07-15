import Link from "next/link";
import { notFound } from "next/navigation";

import { AppStatus, type StatusVariant } from "@/components/AppStatus";
import { StatusBadge } from "@/components/AdminDashboard/Teams/StatusBadge";
import { TeamMetric } from "@/components/AdminDashboard/Teams/TeamMetric";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { fetchAdminAppDetails } from "./server/fetch-app-details";

type AdminAppPageProps = {
  appId: string;
};

const metadataStatusVariants = new Set<StatusVariant>([
  "awaiting_review",
  "changes_requested",
  "unverified",
  "verified",
]);

const getMetadataStatus = (status?: string | null) =>
  status && metadataStatusVariants.has(status as StatusVariant)
    ? (status as StatusVariant)
    : null;

const metadataStatusLabels: Record<StatusVariant, string> = {
  awaiting_review: "In review",
  changes_requested: "Rejected",
  unverified: "Not verified",
  verified: "Verified",
};

export const AdminAppPage = async ({ appId }: AdminAppPageProps) => {
  const details = await fetchAdminAppDetails(appId);

  if (!details) {
    notFound();
  }

  const draftStatus = getMetadataStatus(
    details.draftMetadata?.verification_status,
  );
  const verifiedStatus = getMetadataStatus(
    details.verifiedMetadata?.verification_status,
  );
  const teamStatus = details.team.deleted_at ? "Deleted" : "Active";
  const latestMetadataUpdate = details.metadataVersions[0]?.updated_at;
  const workflowStatus = draftStatus ?? verifiedStatus;

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-2 text-12 font-medium tracking-wide text-grey-400 uppercase">
              Admin / Apps
            </div>
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              {details.verifiedMetadata?.name ??
                details.draftMetadata?.name ??
                details.app.name ??
                "Unnamed app"}
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review application identity and metadata workflow.
            </p>
          </div>

          <div className="min-w-0 rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              App ID
            </div>
            <div className="mt-1 truncate font-mono text-13 font-medium text-grey-900">
              {appId}
            </div>
            <div className="mt-3">
              <span className="inline-flex rounded-full border border-grey-300 bg-grey-100 px-2 py-1 text-12 font-medium text-grey-500">
                {details.app.deleted_at ? "Deleted" : "Not deleted"}
              </span>
            </div>
          </div>
        </div>
      </UIModule>

      <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <UIModule className="min-h-0 overflow-auto p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-16 font-semibold text-grey-900">Overview</h2>
            <Link
              className="text-12 font-medium text-blue-500 hover:text-blue-600"
              href="/admin/apps"
            >
              All apps
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <TeamMetric
              label="Workflow status"
              value={
                workflowStatus
                  ? metadataStatusLabels[workflowStatus]
                  : "No metadata"
              }
            />
            <TeamMetric
              label="Created"
              value={details.app.created_at.slice(0, 10)}
            />
            <TeamMetric
              label="Last metadata update"
              value={latestMetadataUpdate?.slice(0, 10) ?? "—"}
            />
            <TeamMetric
              label="Verified at"
              value={details.verifiedMetadata?.verified_at?.slice(0, 10) ?? "—"}
            />
          </dl>
          <dl className="mt-6 grid gap-2 text-14">
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Source name</dt>
              <dd className="truncate font-medium text-grey-900">
                {details.app.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Deleted at</dt>
              <dd className="font-medium text-grey-900">
                {details.app.deleted_at?.slice(0, 10) ?? "—"}
              </dd>
            </div>
          </dl>
          <section className="mt-6">
            <h3 className="text-14 font-semibold text-grey-900">
              Metadata workflow
            </h3>
            <p className="mt-1 text-12 text-grey-500">
              Metadata status does not represent the full application status.
            </p>
            <div className="mt-2 divide-y divide-grey-100">
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-12 text-grey-500">Latest draft</p>
                  <p className="truncate text-14 font-medium text-grey-900">
                    {details.draftMetadata?.name ?? "No draft metadata"}
                  </p>
                  {details.draftMetadata && (
                    <time className="text-12 text-grey-500">
                      Updated {details.draftMetadata.updated_at.slice(0, 10)}
                    </time>
                  )}
                </div>
                {draftStatus && <AppStatus status={draftStatus} />}
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-12 text-grey-500">Verified metadata</p>
                  <p className="truncate text-14 font-medium text-grey-900">
                    {details.verifiedMetadata?.name ?? "No verified metadata"}
                  </p>
                  {details.verifiedMetadata?.verified_at && (
                    <time className="text-12 text-grey-500">
                      Verified{" "}
                      {details.verifiedMetadata.verified_at.slice(0, 10)}
                    </time>
                  )}
                </div>
                {verifiedStatus && <AppStatus status={verifiedStatus} />}
              </div>
            </div>
          </section>
          <section className="mt-6">
            <h3 className="text-14 font-semibold text-grey-900">
              Metadata history
            </h3>
            <div className="mt-2 divide-y divide-grey-100">
              {details.metadataVersions.length === 0 ? (
                <p className="py-3 text-14 text-grey-500">
                  No metadata history.
                </p>
              ) : (
                details.metadataVersions.map((metadata) => {
                  const status = getMetadataStatus(
                    metadata.verification_status,
                  );

                  return (
                    <div
                      className="flex items-center justify-between gap-3 py-3"
                      key={`${metadata.app_id}:${metadata.updated_at}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-14 font-medium text-grey-900">
                          {metadata.name}
                        </p>
                        <time className="text-12 text-grey-500">
                          Updated {metadata.updated_at.slice(0, 10)}
                        </time>
                      </div>
                      {status && <AppStatus status={status} />}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </UIModule>
        <UIModule className="self-start p-5">
          <h2 className="text-16 font-semibold text-grey-900">Owning team</h2>
          <Link
            className="group mt-4 block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            href={`/admin/teams/${details.team.id}`}
            rel="noreferrer"
            target="_blank"
          >
            <p className="truncate text-14 font-medium text-grey-900 transition-colors group-hover:text-blue-500">
              {details.team.name}
            </p>
            <p className="mt-1 truncate font-mono text-12 text-grey-400">
              {details.team.id}
            </p>
          </Link>
          <dl className="mt-4 grid gap-2 text-14">
            <div className="flex items-center justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Status</dt>
              <dd>
                <StatusBadge status={teamStatus} />
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Created</dt>
              <dd className="font-medium text-grey-900">
                {details.team.created_at.slice(0, 10)}
              </dd>
            </div>
          </dl>
        </UIModule>
      </div>
    </div>
  );
};
