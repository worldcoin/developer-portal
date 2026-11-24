import { EmptyState } from "@/components/AdminDashboard/common/EmptyState";
import { MobileAdminList } from "@/components/AdminDashboard/common/MobileAdminList";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import clsx from "clsx";
import { fetchSandboxAccessRequests } from "./server/fetch-sandbox-requests";
import { SandboxRequestActions } from "./SandboxRequestActions";

const formatDate = (isoDate: string) => isoDate.slice(0, 10);

const StatusBadge = ({ accepted }: { accepted: boolean }) => (
  <span
    className={clsx(
      "inline-flex rounded-full px-2.5 py-0.5 text-12 font-medium capitalize",
      accepted
        ? "bg-system-success-50 text-system-success-700"
        : "bg-system-warning-50 text-system-warning-700",
    )}
  >
    {accepted ? "approved" : "pending"}
  </span>
);

/**
 * Queue of World ID sandbox Android tester requests. Dashboard users approve a
 * request after granting access in Play Console; accepted is never
 * user-controlled.
 */
export const AdminSandboxRequestsPage = async () => {
  const { requests, totalCount, pendingCount } =
    await fetchSandboxAccessRequests();

  return (
    <div className="grid min-h-0 grid-rows-auto/1fr gap-y-4 max-lg:h-auto lg:h-full">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div className="min-w-0">
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              Sandbox requests
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Android tester access requests for the World ID sandbox build.
              Approve each request after granting access in Google Play Console.
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
          <EmptyState>No sandbox access requests yet</EmptyState>
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
                        {request.googleEmail}
                      </div>
                      <div className="mt-0.5 truncate text-12 text-grey-500">
                        {request.userEmail ?? "—"}
                      </div>
                    </div>
                    <StatusBadge accepted={request.accepted} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-14 min-[360px]:mt-4">
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      Requested
                    </dt>
                    <dd className="text-grey-700">
                      {formatDate(request.createdAt)}
                    </dd>
                    <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                      Processed
                    </dt>
                    <dd className="text-grey-700">
                      {request.processedAt
                        ? formatDate(request.processedAt)
                        : "—"}
                    </dd>
                  </dl>
                  <div className="mt-4">
                    {request.accepted ? (
                      <span className="text-13 text-grey-400">Approved</span>
                    ) : (
                      <SandboxRequestActions requestId={request.id} />
                    )}
                  </div>
                </article>
              )}
            />

            <table
              className="hidden w-full border-collapse text-left text-14 lg:table"
              aria-label="Sandbox access requests"
            >
              <thead>
                <tr className="border-b border-grey-200 text-11 font-medium tracking-wide text-grey-400 uppercase">
                  <th className="px-3 py-2">Google email</th>
                  <th className="px-3 py-2">User email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Processed</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-grey-100 text-grey-700"
                  >
                    <td className="px-3 py-2.5 font-medium text-grey-900">
                      {request.googleEmail}
                    </td>
                    <td className="px-3 py-2.5">{request.userEmail ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge accepted={request.accepted} />
                    </td>
                    <td className="px-3 py-2.5">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {request.processedAt
                        ? formatDate(request.processedAt)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {request.accepted ? (
                        <span className="text-grey-400">Approved</span>
                      ) : (
                        <SandboxRequestActions requestId={request.id} />
                      )}
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
