// TODO: delete this file after the RP manager key migration completes.

import {
  fetchAdminRpManagerKeyAudit,
  type AdminRpManagerKeyAudit,
} from "./server/fetch-rp-migration-audit";
import { MigrationCleanupStatus } from "./types";

type AuditSectionProps = {
  rpId: string;
};

const cleanupStatusLabels: Record<MigrationCleanupStatus, string> = {
  [MigrationCleanupStatus.Pending]: "pending",
  [MigrationCleanupStatus.Failed]: "failed",
  [MigrationCleanupStatus.Blocked]: "blocked",
  [MigrationCleanupStatus.ReadyForExternalCleanup]:
    "ready_for_external_cleanup",
  [MigrationCleanupStatus.DeletionScheduled]: "deletion_scheduled",
  [MigrationCleanupStatus.Deleted]: "deleted",
};

const formatCleanupStatus = (value: string) => {
  if (
    Object.values(MigrationCleanupStatus).some((status) => status === value)
  ) {
    return cleanupStatusLabels[value as MigrationCleanupStatus];
  }

  return value;
};

const formatDate = (value: string | null) => (value ? value.slice(0, 10) : "—");

const Field = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) => (
  <div className="min-w-0 border-b border-grey-100 py-2">
    <dt className="text-12 text-grey-500">{label}</dt>
    <dd
      className={
        mono
          ? "mt-1 font-mono text-12 font-medium break-all text-grey-900"
          : "mt-1 text-13 font-medium break-words text-grey-900"
      }
      title={value ?? undefined}
    >
      {value ?? "—"}
    </dd>
  </div>
);

const AuditSectionContent = ({ data }: { data: AdminRpManagerKeyAudit }) => {
  const keyMode = data.isUniqueManagerKey ? "Unique" : "Shared";

  return (
    <dl className="mt-3 min-w-0">
      <Field label="Manager key mode" value={keyMode} />
      <Field label="Current manager key" mono value={data.managerKmsKeyId} />
      {data.audit ? (
        <>
          <Field
            label="Cleanup status"
            value={formatCleanupStatus(data.audit.cleanupStatus)}
          />
          <Field
            label="Old manager key ARN"
            mono
            value={data.audit.oldManagerKmsKeyArn}
          />
          <Field label="Last error" value={data.audit.lastErrorDetail} />
          <Field
            label="Deletion scheduled"
            value={formatDate(data.audit.deletionScheduledAt)}
          />
          <Field
            label="Expected deletion"
            value={formatDate(data.audit.expectedDeletionAt)}
          />
          {data.isUniqueManagerKey && (
            <p className="mt-2 text-13 text-grey-500">
              Cleanup will skip until this RP leaves the unique key.
            </p>
          )}
        </>
      ) : (
        !data.isUniqueManagerKey && (
          <p className="mt-2 text-13 text-grey-500">
            No audit row (born shared or migrated before the table).
          </p>
        )
      )}
    </dl>
  );
};

// ANCHOR: Temporary manager-key audit block in the wide RP overview column.
export const RpManagerKeyMigrationAuditSection = async ({
  rpId,
}: AuditSectionProps) => {
  let data: AdminRpManagerKeyAudit | null = null;
  let loadError = false;

  try {
    data = await fetchAdminRpManagerKeyAudit(rpId);
  } catch {
    loadError = true;
  }

  return (
    <section className="mt-6 min-w-0 border-t border-grey-100 pt-5">
      <h3 className="text-14 font-semibold text-grey-900">
        Manager key migration
      </h3>
      {loadError ? (
        <p className="mt-2 text-13 text-grey-500">
          Migration audit unavailable. Apply Hasura metadata, then reload.
        </p>
      ) : data ? (
        <AuditSectionContent data={data} />
      ) : (
        <p className="mt-2 text-13 text-grey-500">RP registration not found.</p>
      )}
    </section>
  );
};
