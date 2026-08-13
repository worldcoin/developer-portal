// TODO: delete this file after the RP manager key migration completes.
//
// Cleanup checklist:
// 1. Delete web/scenes/Admin/rps/manager-key-migration/.
// 2. Remove the TODO inserts from Admin/rps/page.tsx and Admin/rps/id/page.tsx.
// 3. Remove the native queries and logical models from databases.yaml.
// 4. Revert internal_dashboard_readonly grants for unique/key and audit select.
// 5. Delete web/tests/unit/admin-rp-manager-key-migration-fetch.test.ts.
// 6. Regenerate GraphQL schema/types.

import { UIModule } from "@/components/AdminDashboard/UIModule";

import { QueueLists } from "./QueueLists";
import {
  fetchAdminRpManagerKeyMigration,
  type AdminRpManagerKeyMigrationInventory,
  type AdminRpManagerKeyMigrationStatus,
} from "./server/fetch-migration-status";

const FlagBadge = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <span
    className={
      enabled
        ? "inline-flex rounded-full border border-system-success-300 bg-system-success-50 px-2 py-0.5 text-11 font-medium text-system-success-700"
        : "inline-flex rounded-full border border-grey-300 bg-grey-100 px-2 py-0.5 text-11 font-medium text-grey-500"
    }
  >
    {label}: {enabled ? "on" : "off"}
  </span>
);

const Stat = ({
  hint,
  label,
  value,
  warn,
}: {
  hint: string;
  label: string;
  value: number;
  warn?: boolean;
}) => (
  <div className="min-w-0" title={hint}>
    <div className="truncate text-11 font-medium tracking-wide text-grey-400 uppercase">
      {label}
    </div>
    <div
      className={
        warn && value > 0
          ? "mt-0.5 text-16 font-semibold text-system-error-700"
          : "mt-0.5 text-16 font-semibold text-grey-900"
      }
    >
      {value}
    </div>
  </div>
);

const ProcessSummary = ({
  inventory,
}: {
  inventory: AdminRpManagerKeyMigrationInventory;
}) => {
  const needsPerson =
    inventory.auditFailed +
    inventory.auditBlocked +
    inventory.auditReadyForExternalCleanup +
    inventory.auditDeletionOverdue;

  return (
    <div className="grid gap-3">
      <section>
        <h3 className="text-12 font-semibold text-grey-900">
          1. Switch to the shared key
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          <Stat
            hint="Registered managed RPs that still have a per-RP key. The migrate job picks these."
            label="Still to migrate"
            value={inventory.remainingCronCandidates}
            warn
          />
          <Stat
            hint="An audit row exists but the RP still uses the old key. Cleanup will skip these."
            label="Failed, still unique"
            value={inventory.uniqueWithAudit}
            warn
          />
        </div>
      </section>
      <section>
        <h3 className="text-12 font-semibold text-grey-900">
          2. Delete the old KMS keys
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          <Stat
            hint="Already on the shared key, old key recorded, waiting for the cleanup job."
            label="Waiting for cleanup"
            value={inventory.onSharedWithAudit}
          />
          <Stat
            hint="Cleanup failed, blocked, key in another AWS account, or deletion date already passed."
            label="Needs a person"
            value={needsPerson}
            warn
          />
          <Stat
            hint="KMS deletion is scheduled or the old key is already gone."
            label="Scheduled or deleted"
            value={inventory.auditDeleted + inventory.auditDeletionScheduled}
          />
        </div>
      </section>
    </div>
  );
};

const MigrationPanelContent = ({
  status,
}: {
  status: AdminRpManagerKeyMigrationStatus;
}) => (
  <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-3">
    <ProcessSummary inventory={status.inventory} />
    <QueueLists
      cleanupNeedsAttention={status.cleanupNeedsAttention}
      cleanupNeedsAttentionCount={status.cleanupNeedsAttentionCount}
      remainingCronCandidateCount={status.remainingCronCandidateCount}
      remainingCronCandidates={status.remainingCronCandidates}
    />
  </div>
);

// ANCHOR: Right-side temporary migrate/cleanup panel on /admin/rps.
export const RpManagerKeyMigrationPanel = async () => {
  let status: AdminRpManagerKeyMigrationStatus | null = null;
  let loadError = false;

  try {
    status = await fetchAdminRpManagerKeyMigration();
  } catch {
    loadError = true;
  }

  return (
    <UIModule className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-4">
      <div className="min-w-0 shrink-0">
        <h2 className="text-14 font-semibold text-grey-900">
          Manager key migration
        </h2>
        <p className="mt-0.5 text-12 text-grey-500">
          Unique key → shared key, then delete the old KMS key.
        </p>
        {status && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FlagBadge
              enabled={status.flags.migrationEnabled}
              label="Migrate job"
            />
            <FlagBadge
              enabled={status.flags.cleanupEnabled}
              label="Cleanup job"
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col">
        {loadError || !status ? (
          <p className="text-13 text-grey-500">
            Migration status unavailable. Apply Hasura metadata, then reload.
          </p>
        ) : (
          <MigrationPanelContent status={status} />
        )}
      </div>
    </UIModule>
  );
};
