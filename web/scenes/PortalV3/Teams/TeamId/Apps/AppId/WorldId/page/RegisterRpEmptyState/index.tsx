"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CreateAppDialogV4 } from "@/scenes/PortalV3/layout/CreateAppDialog/index-v4";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Apps without an RP registration can't have v4 actions yet. Reuse the existing
// create-app wizard opened at its enable step for this app (it supports
// `initialStep` + `appId` for exactly this case) rather than rebuilding the
// multi-step signer-key flow.
export const RegisterRpEmptyState = (props: {
  appId: string;
  initialOpen?: boolean;
  // The register_rp Hasura action rejects non-OWNER/ADMIN callers with
  // `unauthorized`, so members get an explanation instead of a dead-end CTA.
  canRegisterRp: boolean;
  // The backend rejects staging registration with `staging_not_supported`, so
  // the Enable CTA would be a guaranteed dead-end for staging apps.
  isStaging: boolean;
  onRegistered: () => void;
  // RP-less apps can still have World ID 3.0 legacy actions; without this link
  // they'd have no navigation to those pages at all.
  legacyActionsHref?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canEnable = props.canRegisterRp && !props.isStaging;
  const [open, setOpen] = useState(Boolean(props.initialOpen) && canEnable);

  // Auto-open only for users who can actually register (mirrors the old
  // migration banner's gating). The effect covers the Auth0 user resolving
  // after mount, which flips `canRegisterRp`.
  useEffect(() => {
    if (props.initialOpen && canEnable) setOpen(true);
  }, [props.initialOpen, canEnable]);

  const closeDialog = () => {
    setOpen(false);
    props.onRegistered();

    // Strip the `enableWorldId4` param so the World ID tab link returns to its
    // clean state. Otherwise the URL keeps the param and clicking the tab again
    // is a no-op (same URL), leaving the user unable to re-open the flow.
    if (searchParams.has("enableWorldId4")) {
      const params = new URLSearchParams(searchParams);
      params.delete("enableWorldId4");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex flex-col items-center gap-2">
        <Typography variant={TYPOGRAPHY.H6}>Set up World ID 4.0</Typography>
        <Typography variant={TYPOGRAPHY.R4} className="max-w-md text-grey-500">
          {props.isStaging
            ? "World ID 4.0 isn't available for staging apps."
            : "Register a Relying Party to start requesting World ID verifications for this app."}
        </Typography>
      </div>

      {canEnable ? (
        <DecoratedButton
          type="button"
          variant="primary"
          onClick={() => setOpen(true)}
        >
          Enable World ID 4.0
        </DecoratedButton>
      ) : !props.isStaging ? (
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
          Ask a team owner or admin to enable World ID 4.0
        </Typography>
      ) : null}

      {props.legacyActionsHref ? (
        <Link
          href={props.legacyActionsHref}
          className="font-world text-13 text-portal-muted underline transition-colors hover:text-portal-ink"
        >
          Looking for your World ID 3.0 legacy actions?
        </Link>
      ) : null}

      {open ? (
        <CreateAppDialogV4
          open={open}
          initialStep="enable-world-id-4-0"
          appId={props.appId}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
};
