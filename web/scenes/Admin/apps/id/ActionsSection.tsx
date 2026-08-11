import type {
  AdminLegacyActionUsage,
  AdminWorldId40ActionUsage,
} from "./types";

type AdminAppActionsSectionProps = {
  legacyActions: AdminLegacyActionUsage[];
  worldId40Actions: AdminWorldId40ActionUsage[];
};

const numberFormatter = new Intl.NumberFormat("en-US");

const formatCount = (value: number) => numberFormatter.format(value);

const getLegacyActionName = (action: AdminLegacyActionUsage) => {
  if (action.action === "") {
    return "Sign in with World ID";
  }

  return action.name || action.action || "Unnamed action";
};

const LegacyActionsTable = ({
  actions,
}: {
  actions: AdminLegacyActionUsage[];
}) => {
  if (actions.length === 0) {
    return (
      <p className="mt-3 rounded-8 border border-grey-100 bg-grey-50 px-3 py-4 text-14 text-grey-500">
        No legacy actions.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-8 border border-grey-100">
      <table className="w-full min-w-[760px] border-collapse text-left text-12">
        <caption className="sr-only">Legacy actions usage</caption>
        <thead className="bg-grey-50 text-grey-500">
          <tr>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 text-right font-medium">
              Total uses / claims
            </th>
            <th className="px-3 py-2 text-right font-medium">
              Unique nullifiers
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grey-100 text-grey-900">
          {actions.map((action) => (
            <tr key={action.id}>
              <td className="max-w-72 px-3 py-3 align-top">
                <p className="truncate text-13 font-medium">
                  {getLegacyActionName(action)}
                </p>
                <p className="mt-1 truncate font-mono text-11 text-grey-500">
                  {action.action || "(empty action value)"}
                </p>
                <p className="mt-1 truncate font-mono text-11 text-grey-400">
                  {action.id}
                </p>
              </td>
              <td className="px-3 py-3 align-top">
                <span className="text-grey-600 inline-flex rounded-full border border-grey-200 bg-grey-50 px-2 py-1 font-medium capitalize">
                  {action.status}
                </span>
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-grey-500">
                {action.createdAt.slice(0, 10)}
              </td>
              <td className="px-3 py-3 text-right align-top font-medium tabular-nums">
                {formatCount(action.totalUses)}
              </td>
              <td className="px-3 py-3 text-right align-top font-medium tabular-nums">
                {formatCount(action.uniqueNullifiers)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const WorldId40ActionsTable = ({
  actions,
}: {
  actions: AdminWorldId40ActionUsage[];
}) => {
  if (actions.length === 0) {
    return (
      <p className="mt-3 rounded-8 border border-grey-100 bg-grey-50 px-3 py-4 text-14 text-grey-500">
        No World ID 4.0 actions.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-8 border border-grey-100">
      <table className="w-full min-w-[760px] border-collapse text-left text-12">
        <caption className="sr-only">World ID 4.0 actions usage</caption>
        <thead className="bg-grey-50 text-grey-500">
          <tr>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Environment</th>
            <th className="px-3 py-2 font-medium">RP ID</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 text-right font-medium">
              Recorded unique uses
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grey-100 text-grey-900">
          {actions.map((action) => (
            <tr key={action.id}>
              <td className="max-w-72 px-3 py-3 align-top">
                <p className="truncate text-13 font-medium">
                  {action.action || "Unnamed action"}
                </p>
                <p className="mt-1 truncate font-mono text-11 text-grey-400">
                  {action.id}
                </p>
              </td>
              <td className="px-3 py-3 align-top">
                <span className="text-grey-600 inline-flex rounded-full border border-grey-200 bg-grey-50 px-2 py-1 font-medium capitalize">
                  {action.environment}
                </span>
              </td>
              <td className="max-w-48 truncate px-3 py-3 align-top font-mono text-11 text-grey-500">
                {action.rpId}
              </td>
              <td className="px-3 py-3 align-top whitespace-nowrap text-grey-500">
                {action.createdAt.slice(0, 10)}
              </td>
              <td className="px-3 py-3 text-right align-top font-medium tabular-nums">
                {formatCount(action.recordedUniqueUses)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const AdminAppActionsSection = ({
  legacyActions,
  worldId40Actions,
}: AdminAppActionsSectionProps) => {
  return (
    <section className="mt-8 border-t border-grey-100 pt-6">
      <h3 className="text-14 font-semibold text-grey-900">Actions</h3>
      <p className="mt-1 text-12 text-grey-500">
        Current all-time database snapshot. These values are not filtered by
        claim date.
      </p>

      <div className="mt-5">
        <h4 className="text-13 font-semibold text-grey-900">Legacy actions</h4>
        <p className="mt-1 text-12 text-grey-500">
          Total uses / claims is the sum of the stored use counter. Unique
          nullifiers counts the current action-scoped records.
        </p>
        <LegacyActionsTable actions={legacyActions} />
      </div>

      <div className="mt-6">
        <h4 className="text-13 font-semibold text-grey-900">
          World ID 4.0 actions
        </h4>
        <p className="mt-1 text-12 text-grey-500">
          Recorded unique uses counts stored V4 nullifiers. It does not count
          repeated verifications separately.
        </p>
        <WorldId40ActionsTable actions={worldId40Actions} />
      </div>
    </section>
  );
};
