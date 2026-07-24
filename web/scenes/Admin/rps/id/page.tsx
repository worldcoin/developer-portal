import Link from "next/link";
import { notFound } from "next/navigation";

import {
  RpModeBadge,
  RpStatusBadge,
} from "@/components/AdminDashboard/RPs/StatusBadge";
import type {
  RpRegistrationMode,
  RpStatus,
} from "@/components/AdminDashboard/RPs/types";
import { StatusBadge } from "@/components/AdminDashboard/Teams/StatusBadge";
import { TeamMetric } from "@/components/AdminDashboard/Teams/TeamMetric";
import { UIModule } from "@/components/AdminDashboard/UIModule";

import { fetchAdminRpDetails } from "./server/fetch-rp-details";

type AdminRpPageProps = {
  rpId: string;
};

export const AdminRpPage = async ({ rpId }: AdminRpPageProps) => {
  if (!/^rp_[0-9a-f]{16}$/i.test(rpId)) {
    notFound();
  }

  const details = await fetchAdminRpDetails(rpId);

  if (!details) {
    notFound();
  }

  const { app, rp, team } = details;
  const teamStatus = team.deleted_at ? "Deleted" : "Active";

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-2 text-12 font-medium tracking-wide text-grey-400 uppercase">
              Admin / RPs
            </div>
            <h1 className="truncate font-mono text-24 font-semibold tracking-[-0.02em] text-grey-900">
              {rp.rp_id}
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review relying party registration state and ownership.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <RpModeBadge mode={rp.mode as RpRegistrationMode} />
              <RpStatusBadge status={rp.status as RpStatus} />
            </div>
          </div>

          <div className="min-w-0 rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              App ID
            </div>
            <div className="mt-1 truncate font-mono text-13 font-medium text-grey-900">
              {rp.app_id}
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
              href="/admin/rps"
            >
              All RPs
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <TeamMetric label="Mode" value={String(rp.mode)} />
            <TeamMetric label="Production status" value={String(rp.status)} />
            <TeamMetric
              label="Staging status"
              value={rp.staging_status ? String(rp.staging_status) : "—"}
            />
            <TeamMetric label="Created" value={rp.created_at.slice(0, 10)} />
          </dl>
          <dl className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <TeamMetric label="Updated" value={rp.updated_at.slice(0, 10)} />
          </dl>
          <dl className="mt-6 grid gap-2 text-14">
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Mode</dt>
              <dd>
                <RpModeBadge mode={rp.mode as RpRegistrationMode} />
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Signer address</dt>
              <dd className="truncate font-mono text-13 font-medium text-grey-900">
                {rp.signer_address ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Operation hash</dt>
              <dd className="truncate font-mono text-13 font-medium text-grey-900">
                {rp.operation_hash ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
              <dt className="text-grey-500">Staging operation hash</dt>
              <dd className="truncate font-mono text-13 font-medium text-grey-900">
                {rp.staging_operation_hash ?? "—"}
              </dd>
            </div>
          </dl>
        </UIModule>
        <div className="grid content-start gap-4">
          <UIModule className="self-start p-5">
            <h2 className="text-16 font-semibold text-grey-900">App</h2>
            <Link
              className="group mt-4 block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              href={`/admin/apps/${app.id}`}
              rel="noreferrer"
              target="_blank"
            >
              <p className="truncate text-14 font-medium text-grey-900 transition-colors group-hover:text-blue-500">
                {app.name || "Unnamed app"}
              </p>
              <p className="mt-1 truncate font-mono text-12 text-grey-400">
                {app.id}
              </p>
            </Link>
            <dl className="mt-4 grid gap-2 text-14">
              <div className="flex items-center justify-between gap-4 border-b border-grey-100 py-2">
                <dt className="text-grey-500">Deleted</dt>
                <dd className="font-medium text-grey-900">
                  {app.deleted_at ? app.deleted_at.slice(0, 10) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-grey-100 py-2">
                <dt className="text-grey-500">Created</dt>
                <dd className="font-medium text-grey-900">
                  {app.created_at.slice(0, 10)}
                </dd>
              </div>
            </dl>
          </UIModule>
          <UIModule className="self-start p-5">
            <h2 className="text-16 font-semibold text-grey-900">Owning team</h2>
            <Link
              className="group mt-4 block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              href={`/admin/teams/${team.id}`}
              rel="noreferrer"
              target="_blank"
            >
              <p className="truncate text-14 font-medium text-grey-900 transition-colors group-hover:text-blue-500">
                {team.name || "Unnamed team"}
              </p>
              <p className="mt-1 truncate font-mono text-12 text-grey-400">
                {team.id}
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
                  {team.created_at.slice(0, 10)}
                </dd>
              </div>
            </dl>
          </UIModule>
        </div>
      </div>
    </div>
  );
};
