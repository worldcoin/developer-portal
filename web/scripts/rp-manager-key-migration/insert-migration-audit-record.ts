import "server-only";

import { resolveKeyId } from "@/api/helpers/kms";
import { gql, type GraphQLClient } from "graphql-request";

type InsertMigrationAuditRecordInput = {
  graphqlClient: GraphQLClient;
  rpId: string;
  appId: string;
  oldManagerKeyId: string;
  sharedManagerKeyId: string;
  kmsRegion: string;
};

type InsertMigrationAuditRecordResult = {
  insert_rp_manager_key_migration_audit_one: {
    rp_id: string;
  } | null;
};

// ANCHOR: Persist the old manager key before migration overwrites rp_registration.
export async function insertMigrationAuditRecord({
  graphqlClient,
  rpId,
  appId,
  oldManagerKeyId,
  sharedManagerKeyId,
  kmsRegion,
}: InsertMigrationAuditRecordInput): Promise<void> {
  const oldManagerKeyArn = resolveKeyId(oldManagerKeyId, kmsRegion);

  if (!oldManagerKeyArn.startsWith("arn:aws:kms:")) {
    throw new Error("Could not resolve the old manager KMS key to an ARN");
  }

  await graphqlClient.request<
    InsertMigrationAuditRecordResult,
    {
      rp_id: string;
      app_id: string;
      old_manager_kms_key_id: string;
      old_manager_kms_key_arn: string;
      shared_manager_kms_key_id: string;
    }
  >(
    gql`
      mutation InsertRpManagerKeyMigrationAuditRecord(
        $rp_id: String!
        $app_id: String!
        $old_manager_kms_key_id: String!
        $old_manager_kms_key_arn: String!
        $shared_manager_kms_key_id: String!
      ) {
        insert_rp_manager_key_migration_audit_one(
          object: {
            rp_id: $rp_id
            app_id: $app_id
            old_manager_kms_key_id: $old_manager_kms_key_id
            old_manager_kms_key_arn: $old_manager_kms_key_arn
            shared_manager_kms_key_id: $shared_manager_kms_key_id
          }
          on_conflict: {
            constraint: rp_manager_key_migration_audit_pkey
            update_columns: []
          }
        ) {
          rp_id
        }
      }
    `,
    {
      rp_id: rpId,
      app_id: appId,
      old_manager_kms_key_id: oldManagerKeyId,
      old_manager_kms_key_arn: oldManagerKeyArn,
      shared_manager_kms_key_id: sharedManagerKeyId,
    },
  );
}
