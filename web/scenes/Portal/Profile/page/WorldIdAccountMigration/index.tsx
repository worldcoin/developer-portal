"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { LinkIcon } from "@/components/Icons/LinkIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { WORLD_ID_MIGRATION_APP_IDS } from "@/lib/constants";
import {
  deviceLegacy,
  IDKitRequestWidget,
  type IDKitResult,
} from "@worldcoin/idkit";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { buildMockRpContext } from "../../../../../lib/rp";
import type { MigrationState } from "./types";

const statusCopy: Record<
  MigrationState["type"],
  { description: string; className: string }
> = {
  idle: {
    description:
      "Sign in With World ID method is deprecated. If you had a legacy account, link your account to continue using your teams and apps.",
    className: "text-grey-400",
  },
  error: {
    description: "Try again in a moment.",
    className: "text-system-error-600",
  },
};

export const WorldIdAccountMigration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [migrationState, setMigrationState] = useState<MigrationState>({
    type: "idle",
  });

  const appId =
    WORLD_ID_MIGRATION_APP_IDS[process.env.NEXT_PUBLIC_APP_ENV ?? ""];

  useEffect(() => {
    if (!appId) {
      setMigrationState({
        type: "error",
        message: "World ID account migration is not configured.",
      });
    }
  }, [appId]);

  const copy = statusCopy[migrationState.type];
  const description =
    migrationState.type === "error" ? migrationState.message : copy.description;

  const startMigrationFlow = useCallback(() => {
    if (!appId) {
      setMigrationState({
        type: "error",
        message: "World ID account migration is not configured.",
      });
      return;
    }

    setMigrationState({ type: "idle" });
    setIsOpen(true);
  }, [appId]);

  const handleSuccess = useCallback(async (result: IDKitResult) => {
    // The migration flow requests device-legacy proofs, so we expect a v3
    // result whose first response carries the flat proof fields.
    if (result.protocol_version !== "3.0") {
      setMigrationState({
        type: "error",
        message: "Unsupported World ID proof for account migration.",
      });
      return;
    }

    const response = result.responses[0];
    if (!response) {
      setMigrationState({
        type: "error",
        message: "World ID proof is missing.",
      });
      return;
    }

    // Part 1 stops here: the verification + legacy account merge endpoint
    // lands in the follow-up PR. Log the proof so the flow can be exercised
    // end-to-end in the meantime.
    console.log("World ID account migration proof", {
      proof: response.proof,
      merkle_root: response.merkle_root,
      nullifier: response.nullifier,
      signal_hash: response.signal_hash,
      verification_level: response.identifier,
    });

    setMigrationState({ type: "idle" });
  }, []);

  return (
    <div className="grid w-full gap-y-5 rounded-12 border border-grey-200 p-6">
      <div className="grid gap-y-3">
        <Typography as="h2" variant={TYPOGRAPHY.R3}>
          Restore legacy account
        </Typography>

        <div className={clsx("rounded-lg py-3", copy.className)}>
          <Typography variant={TYPOGRAPHY.R4}>{description}</Typography>
        </div>
      </div>

      {migrationState.type === "idle" && (
        <DecoratedButton
          type="button"
          variant="primary"
          icon={<LinkIcon className="size-4" />}
          onClick={startMigrationFlow}
          className="justify-self-start"
        >
          Link World ID
        </DecoratedButton>
      )}

      {appId && (
        <IDKitRequestWidget
          open={isOpen}
          onOpenChange={setIsOpen}
          app_id={appId}
          preset={deviceLegacy()}
          onSuccess={handleSuccess}
          // Sign in With World ID uses the empty string action
          action=""
          // Mock 4.0 RP context, gets ignored under the hood
          rp_context={buildMockRpContext(appId)}
          // Gets ignored when passing `deviceLegacy`
          allow_legacy_proofs={true}
        />
      )}
    </div>
  );
};
