import { EmptyState } from "@/components/AdminDashboard/common/EmptyState";
import { MobileAdminList } from "@/components/AdminDashboard/common/MobileAdminList";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import clsx from "clsx";
import { SandboxRequestIosActions } from "./SandboxRequestIosActions";
import {
  fetchSandboxAccessRequestsIos,
  type SandboxAccessRequestIosStatus,
} from "./server/fetch-sandbox-requests-ios";

const formatDate = (isoDate: string) => isoDate.slice(0, 10);
const formatTimestamp = (isoDate: string | null) =>
  isoDate ? isoDate.replace("T", " ").replace(/\.\d{3}Z$/, " UTC") : "—";

const statusClassNames: Record<SandboxAccessRequestIosStatus, string> = {
  approved: "bg-system-success-50 text-system-success-700",
  pending: "bg-system-warning-50 text-system-warning-700",
  rejected: "bg-system-error-50 text-system-error-700",
  revoked: "bg-grey-100 text-grey-700",
};

const isActionableStatus = (status: SandboxAccessRequestIosStatus) =>
  status === "pending" || status === "approved";

const StatusBadge = ({ status }: { status: SandboxAccessRequestIosStatus }) => (
  <span
    className={clsx(
      "inline-flex rounded-full px-2.5 py-0.5 text-12 font-medium capitalize",
      statusClassNames[status],
    )}
  >
    {status}
  </span>
);

export const AdminSandboxRequestsIosPage = async () => {
  const { requests, totalCount, pendingCount } =
    await fetchSandboxAccessRequestsIos();

  return (
    <div className="grid min-h-0 grid-rows-auto/1fr gap-y-4 max-lg:h-auto lg:h-full">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div className="min-w-0">
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              Sandbox / iOS
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              App Store Connect enrollment requests for the World ID sandbox
              build. Approval enrolls the tester in App Store Connect;
              revocation removes the tester from the configured beta group.
            </p>
          </div>

          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Pending
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {pendingCount}
            </div>
          </div>

          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Total
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {totalCount}
            </div>
          </div>
        </div>
      </UIModule>

      <UIModule className="min-h-0 min-w-0 overflow-auto p-4">
        {requests.length === 0 ? (
          <EmptyState>No iOS sandbox access requests yet</EmptyState>
        ) : (
          <>
            <MobileAdminList
              data={requests}
              renderCard={(request) => (
                <article
                  className="min-w-0 overflow-hidden rounded-16 border border-grey-100 bg-grey-0 p-3 shadow-sm min-[360px]:p-4"
                  key={request.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-16 font-medium text-grey-900">
                        {request.ascEmail}
                      </div>
                      <div className="mt-0.5 truncate text-12 text-grey-500">
                        {request.portalEmail}
                      </div>
                      <div className="mt-0.5 truncate text-12 text-grey-500">
                        {request.teamId}
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-14 min-[360px]:mt-4">
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      First access
                    </dt>
                    <dd className="text-grey-700">
                      {formatDate(request.createdAt)}
                    </dd>
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      Updated
                    </dt>
                    <dd className="text-grey-700">
                      {formatDate(request.updatedAt)}
                    </dd>
                  </dl>
                  {isActionableStatus(request.status) ? (
                    <div className="mt-4">
                      <SandboxRequestIosActions
                        requestId={request.id}
                        status={request.status}
                      />
                    </div>
                  ) : null}
                  <dl className="mt-4 grid gap-2 text-14">
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      Revoked at
                    </dt>
                    <dd className="break-words text-grey-700">
                      {formatTimestamp(request.revokedAt)}
                    </dd>
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      Revoked by
                    </dt>
                    <dd className="break-words text-grey-700">
                      {request.revokedBy ?? "—"}
                    </dd>
                  </dl>
                </article>
              )}
            />

            <table
              className="hidden w-full border-collapse text-left text-14 lg:table"
              aria-label="iOS sandbox access requests"
            >
              <thead>
                <tr className="border-b border-grey-200 text-11 font-medium tracking-wide text-grey-400 uppercase">
                  <th className="px-3 py-2">ASC email</th>
                  <th className="px-3 py-2">Portal email</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">First access</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Revoked at</th>
                  <th className="px-3 py-2">Revoked by</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-grey-100 text-grey-700"
                  >
                    <td className="px-3 py-2.5 font-medium text-grey-900">
                      {request.ascEmail}
                    </td>
                    <td className="px-3 py-2.5">{request.portalEmail}</td>
                    <td className="px-3 py-2.5">{request.teamId}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {formatDate(request.updatedAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {isActionableStatus(request.status) ? (
                        <SandboxRequestIosActions
                          requestId={request.id}
                          status={request.status}
                        />
                      ) : (
                        <span className="text-grey-400 capitalize">
                          {request.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatTimestamp(request.revokedAt)}
                    </td>
                    <td className="max-w-64 px-3 py-2.5 break-words">
                      {request.revokedBy ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </UIModule>
    </div>
  );
};
