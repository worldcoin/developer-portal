"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { LinkIcon } from "@/components/Icons/LinkIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { WORLD_ID_MIGRATION_APP_IDS } from "@/lib/constants";
import { isWorldUser } from "@/lib/is-world-user";
import { buildMockRpContext } from "@/lib/rp";
import type { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import {
  deviceLegacy,
  IDKitRequestWidget,
  type IDKitResult,
} from "@worldcoin/idkit";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import type { MigrationResponse, MigrationState } from "./types";

type WorldIdAccountMigrationProps = {
  auth0User: Auth0SessionUser["user"] | undefined;
  isLinked: boolean;
  onLinkSuccess?: () => void;
};

const statusCopy: Record<
  MigrationState["type"],
  { description: string; className: string }
> = {
  idle: {
    description:
      "Sign in With World ID method is deprecated. If you had a legacy account, link your account to continue using your teams and apps.",
    className: "text-grey-400",
  },
  checking: {
    description: "Verifying your World ID proof.",
    className: "text-grey-400",
  },
  error: {
    description: "Try again in a moment.",
    className: "text-system-error-600",
  },
  already_linked: {
    description: "This profile already has a World ID account.",
    className: "text-grey-400",
  },
  merged: {
    description:
      "Your Sign in with World ID account was merged into this profile. Its teams and apps are now available here.",
    className: "text-system-success-700",
  },
  not_found: {
    description: "No existing account matched your World ID.",
    className: "text-grey-400",
  },
};

const isDoneState = (type: MigrationState["type"]) =>
  type === "merged" || type === "already_linked";

export const WorldIdAccountMigration = ({
  auth0User,
  isLinked,
  onLinkSuccess,
}: WorldIdAccountMigrationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [migrationState, setMigrationState] = useState<MigrationState>({
    type: isLinked ? "already_linked" : "idle",
  });

  const appId =
    WORLD_ID_MIGRATION_APP_IDS[process.env.NEXT_PUBLIC_APP_ENV ?? ""];

  const shouldHide =
    process.env.NEXT_PUBLIC_ENABLE_WORLD_ID_RESTORATION !== "true" ||
    Boolean(auth0User && isWorldUser(auth0User));

  useEffect(() => {
    if (!appId) {
      setMigrationState({
        type: "error",
        message: "World ID account migration is not configured.",
      });
      return;
    }

    if (isLinked) {
      // Don't clobber the richer "merged" success state when the
      // me query refetch flips isLinked after a successful migration.
      setMigrationState((state) =>
        isDoneState(state.type) ? state : { type: "already_linked" },
      );
    }
  }, [isLinked, appId]);

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

  const handleSuccess = useCallback(
    async (result: IDKitResult) => {
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

      setMigrationState({ type: "checking" });

      try {
        const migrationResponse = await fetch(
          urls.api.worldIdAccountMigration(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proof: response.proof,
              merkle_root: response.merkle_root,
              nullifier: response.nullifier,
              signal_hash: response.signal_hash,
              verification_level: response.identifier,
            }),
          },
        );

        const payload = (await migrationResponse.json().catch(() => null)) as
          | MigrationResponse
          | { detail?: string }
          | null;

        if (!migrationResponse.ok || !payload || !("status" in payload)) {
          throw new Error(
            (payload && "detail" in payload && payload.detail) ||
              "There was an error linking this World ID.",
          );
        }

        setMigrationState({ type: payload.status });

        if (payload.status === "merged") {
          // Refresh the me query so world_id_nullifier (and any merged
          // teams) are reflected across the portal.
          onLinkSuccess?.();
        }
      } catch (error) {
        setMigrationState({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "There was an error linking this World ID.",
        });
      }
    },
    [onLinkSuccess],
  );

  // Feature-flagged (ships dark). A Sign in with World ID session IS a legacy
  // account, so migration only makes sense from an email account. Hide only on
  // a positive world-id match: useUser() resolves asynchronously, so auth0User
  // is undefined on early renders and the card must not fail closed while it
  // loads.
  if (shouldHide) {
    return null;
  }

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
