"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { ErrorPage } from "@/components/ErrorPage";
import { FloatingInput } from "@/components/FloatingInput";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { inferHttps } from "@/lib/schema";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import type { FieldError } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { use, useEffect, useMemo, useState } from "react";
import { QrQuickAction } from "../../Configuration/BasicInformation/QrQuickAction";
import { MiniAppSubTabs } from "../SubTabs";
import { useUpdateIntegrationUrlMutation } from "./graphql/client/update-integration-url.generated";

const isValidHttpsUrl = (value?: string | null): value is string =>
  Boolean(value && /^https:\/\/\S+/.test(value));

type DevelopMiniAppProps = {
  params: Promise<Record<string, string>>;
};

/**
 * "Develop" mini-app scene.
 *
 * There is one URL column — `app_metadata.integration_url` — and it lives on
 * each metadata row. While a row is `unverified` (the draft) the developer can
 * edit it; once they submit for review the row becomes `awaiting_review` then
 * `verified`, and the Hasura `user` update permission (which only allows
 * `verification_status = unverified` rows) makes it immutable. So the "test URL"
 * and "the URL you submit" are the same value at different lifecycle stages —
 * no second column.
 *
 * This page lets the developer edit + save that draft URL and test it:
 *
 * 1. Development preview — an editable App URL saved directly to the draft row's
 *    `integration_url`, plus a QR that is the canonical World App launcher
 *    scoped to that row via `draft_id`. The launcher carries no URL itself; the
 *    public app endpoint (`api/v2/public/app/[app_id]`) resolves `draft_id` to
 *    the row and returns its saved `integration_url`, so the QR opens exactly
 *    what was saved. The field is read-only once the row leaves `unverified`.
 *
 * 2. Live app — the plain launcher (no `draft_id`), which the endpoint resolves
 *    to the reviewer-approved verified row. Immutable; only changes through a
 *    new review. Shown once a verified version exists.
 *
 * `isMiniApp` is read from `app_metadata.app_mode` (external apps have no
 * mini-app launcher) rather than the wizard-only `isMiniAppAtom`, which isn't
 * initialized on this page.
 */
export const DevelopMiniApp = ({ params }: DevelopMiniAppProps) => {
  const routeParams = use(params);
  const appId = routeParams?.appId as `app_${string}`;

  const { data, loading, error, refetch } = useFetchAppMetadataQuery({
    variables: { id: appId },
  });

  const app = data?.app[0];
  // Non-verified row (unverified or awaiting_review) is the draft the developer
  // works on; verified row is the published, immutable one.
  const draftMetadata = app?.app_metadata?.[0];
  const verifiedMetadata = app?.verified_app_metadata?.[0];
  const appMetadata = draftMetadata ?? verifiedMetadata;

  const isMiniApp = appMetadata?.app_mode === "mini-app";
  // Only an unverified draft row is editable — matches the Hasura update perm.
  const isEditable = draftMetadata?.verification_status === "unverified";
  const savedUrl = draftMetadata?.integration_url ?? "";

  const [url, setUrl] = useState("");
  const [updateIntegrationUrl, { loading: saving }] =
    useUpdateIntegrationUrlMutation();

  // Seed the field from the saved draft URL, and re-sync after a save refetches.
  // `savedUrl` is stable during editing, so this never clobbers in-flight edits.
  useEffect(() => {
    setUrl(savedUrl);
  }, [savedUrl]);

  // `draft_id` scopes the launcher to the draft row so the endpoint resolves
  // that row's saved integration_url.
  const devMiniAppUrl = useMemo(() => {
    if (!draftMetadata?.id) {
      return null;
    }
    return `https://world.org/mini-app?app_id=${appId}&path=&draft_id=${draftMetadata.id}`;
  }, [appId, draftMetadata?.id]);

  // No `draft_id` → the endpoint resolves the reviewer-approved verified row.
  const liveMiniAppUrl = `https://world.org/mini-app?app_id=${appId}&path=`;

  if (!loading && (error || !app || !appMetadata)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const urlError: FieldError | undefined =
    url && !isValidHttpsUrl(url)
      ? { type: "validate", message: "Must be a valid https:// URL" }
      : undefined;

  const isDirty = url !== savedUrl;
  const canSave =
    !saving &&
    isDirty &&
    (url === "" || isValidHttpsUrl(url)) &&
    Boolean(draftMetadata?.id);

  const handleSave = async () => {
    if (!draftMetadata?.id) {
      return;
    }
    try {
      await updateIntegrationUrl({
        variables: { id: draftMetadata.id, integration_url: url },
      });
      await refetch();
      toast.success("App URL saved");
    } catch {
      toast.error("Failed to save App URL");
    }
  };

  const showDevQr =
    isMiniApp && Boolean(devMiniAppUrl) && isValidHttpsUrl(savedUrl);
  const showLiveQr =
    isMiniApp && isValidHttpsUrl(verifiedMetadata?.integration_url);

  return (
    <div className="py-10">
      <div className="md:hidden">
        <MiniAppSubTabs />
      </div>

      <div className="mx-auto grid max-w-[560px] gap-y-8 pt-4">
        <div className="grid gap-y-2 text-center">
          <Typography variant={TYPOGRAPHY.H6} className="font-normal">
            Develop your mini app
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Save your App URL and scan the QR code to open it in World App. You
            can keep changing it until you submit for review, which locks it in.
          </Typography>
        </div>

        {loading ? (
          <Skeleton height={240} />
        ) : (
          isMiniApp && (
            <>
              {draftMetadata ? (
                <div className="grid gap-y-6">
                  <div className="grid gap-y-4">
                    <FloatingInput
                      id="dev_app_url"
                      label="App URL"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      onBlur={() => {
                        const inferred = inferHttps(url);
                        if (inferred !== url) {
                          setUrl(inferred);
                        }
                      }}
                      errors={urlError}
                      disabled={!isEditable}
                      readOnly={!isEditable}
                    />
                    {isEditable ? (
                      <div className="flex justify-end">
                        <DecoratedButton
                          type="button"
                          className="h-12 w-40"
                          disabled={!canSave}
                          onClick={() => {
                            void handleSave();
                          }}
                        >
                          <Typography variant={TYPOGRAPHY.M3}>
                            {saving ? "Saving…" : "Save"}
                          </Typography>
                        </DecoratedButton>
                      </div>
                    ) : (
                      <Typography
                        variant={TYPOGRAPHY.R4}
                        className="text-grey-500"
                      >
                        This URL is under review and can no longer be changed
                        here.
                      </Typography>
                    )}
                  </div>

                  {showDevQr && devMiniAppUrl ? (
                    <div className="grid gap-y-2">
                      {isDirty && (
                        <Typography
                          variant={TYPOGRAPHY.R4}
                          className="text-center text-system-warning-600"
                        >
                          Save your changes to update the QR code preview.
                        </Typography>
                      )}
                      <div className="flex justify-center">
                        <QrQuickAction
                          url={devMiniAppUrl}
                          showDraftMiniAppFlag
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
                        <AlertIcon className="size-4 text-white" />
                      </div>
                      <Typography
                        variant={TYPOGRAPHY.B3}
                        className="flex-1 text-system-warning-600"
                      >
                        Save a valid App URL to generate the QR code preview.
                      </Typography>
                    </div>
                  )}
                </div>
              ) : null}

              {showLiveQr && (
                <div className="grid gap-y-6 border-t border-grey-100 pt-8">
                  <div className="grid gap-y-2">
                    <Typography variant={TYPOGRAPHY.H6} className="font-normal">
                      Live app
                    </Typography>
                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="text-grey-500"
                    >
                      This is your published App URL. Scan to open your live
                      mini app — it only changes through a new review.
                    </Typography>
                  </div>

                  <FloatingInput
                    id="live_app_url"
                    label="App URL"
                    value={verifiedMetadata?.integration_url ?? ""}
                    disabled
                    readOnly
                  />

                  <div className="flex justify-center">
                    <QrQuickAction
                      url={liveMiniAppUrl}
                      showDraftMiniAppFlag={false}
                    />
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};
