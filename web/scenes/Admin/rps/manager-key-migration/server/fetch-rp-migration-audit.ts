// TODO: delete this file after the RP manager key migration completes.

import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../graphql/server/fetch-admin-rp-manager-key-audit.generated";

export type AdminRpManagerKeyAudit = {
  isUniqueManagerKey: boolean;
  audit: {
    rpId: string;
    appId: string;
    oldManagerKmsKeyId: string;
    oldManagerKmsKeyArn: string;
    sharedManagerKmsKeyId: string;
    cleanupStatus: string;
    lastErrorDetail: string | null;
    deletionScheduledAt: string | null;
    expectedDeletionAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

// ANCHOR: Load unique-key flag and optional audit row for one RP detail page.
export const fetchAdminRpManagerKeyAudit = async (
  rpId: string,
): Promise<AdminRpManagerKeyAudit | null> => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminRpManagerKeyAudit({ rpId });

    if (!data.rp_registration_by_pk) {
      return null;
    }

    const auditRow = data.rp_manager_key_migration_audit_by_pk;

    return {
      isUniqueManagerKey: data.rp_registration_by_pk.is_unique_manager_key,
      audit: auditRow
        ? {
            rpId: auditRow.rp_id,
            appId: auditRow.app_id,
            oldManagerKmsKeyId: auditRow.old_manager_kms_key_id,
            oldManagerKmsKeyArn: auditRow.old_manager_kms_key_arn,
            sharedManagerKmsKeyId: auditRow.shared_manager_kms_key_id,
            cleanupStatus: auditRow.cleanup_status,
            lastErrorDetail: auditRow.last_error_detail ?? null,
            deletionScheduledAt: auditRow.deletion_scheduled_at ?? null,
            expectedDeletionAt: auditRow.expected_deletion_at ?? null,
            createdAt: auditRow.created_at,
            updatedAt: auditRow.updated_at,
          }
        : null,
    };
  } catch (error) {
    logger.error("Failed to fetch admin RP manager key audit", {
      error,
      rpId,
    });
    throw error;
  }
};
