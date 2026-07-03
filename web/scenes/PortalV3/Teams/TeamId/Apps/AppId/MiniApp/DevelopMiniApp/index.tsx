"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { FloatingInput } from "@/components/FloatingInput";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { inferHttps } from "@/lib/schema";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import type { FieldError } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { use, useEffect, useMemo, useState } from "react";
import { QrQuickAction } from "../../Configuration/BasicInformation/QrQuickAction";
import { MiniAppSubTabs } from "../SubTabs";

const isValidHttpsUrl = (value?: string | null): value is string =>
  Boolean(value && /^https:\/\/\S+/.test(value));

type DevelopMiniAppProps = {
  params: Promise<Record<string, string>>;
};

/**
 * "Develop" mini-app scene: two App URL fields, each driving its own QR.
 *
 * 1. Test App URL — editable, non-persistent. Nothing typed here is ever sent
 *    to the server from this page (the URL only persists via submit-for-review).
 *    Its QR encodes the typed URL directly so it can be tested regardless of app
 *    state. Seeded with the saved URL for convenience; edits are local-only.
 *
 * 2. App URL — read-only, shown only when this is a mini app that has been
 *    submitted for review (awaiting_review or verified). Its QR is the World App
 *    launcher built normally from server metadata (with draft_id while in
 *    review, the production launcher once verified). Read-only because once
 *    submitted the URL must not change from this page — un-submit first.
 *
 * `isMiniApp` is derived from `app_metadata.app_mode` here rather than the
 * `isMiniAppAtom`, which is only initialized inside the configuration wizard —
 * on this page nobody writes `app_mode` into the atom, so reading it would
 * return its default `false` (or a stale value from a prior wizard visit).
 */
export const DevelopMiniApp = ({ params }: DevelopMiniAppProps) => {
  const routeParams = use(params);
  const appId = routeParams?.appId as `app_${string}`;

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: { id: appId },
  });

  const app = data?.app[0];
  const appMetadata = app?.app_metadata?.[0] ?? app?.verified_app_metadata?.[0];

  const [testUrl, setTestUrl] = useState("");

  // Seed the test field with the persisted URL once metadata loads. After this
  // the value is purely local — edits never reach the server from this page.
  useEffect(() => {
    if (appMetadata?.integration_url) {
      setTestUrl(appMetadata.integration_url);
    }
  }, [appMetadata?.integration_url]);

  const isMiniApp = appMetadata?.app_mode === "mini-app";
  const isVerified = appMetadata?.verification_status === "verified";
  const submittedForReview =
    appMetadata?.verification_status === "awaiting_review" || isVerified;
  const showActualQr = isMiniApp && submittedForReview;

  // The World App launcher loads the App URL from server metadata, so it always
  // reflects the submitted URL (not the local test field). draft_id scopes the
  // preview to the in-review row; the verified launcher has no draft_id.
  const actualMiniAppUrl = useMemo(() => {
    let url = `https://world.org/mini-app?app_id=${appId}&path=`;
    if (!isVerified && appMetadata?.id) {
      url += `&draft_id=${appMetadata.id}`;
    }
    return url;
  }, [appId, isVerified, appMetadata?.id]);

  if (!loading && (error || !app || !appMetadata)) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const testUrlError: FieldError | undefined =
    testUrl && !isValidHttpsUrl(testUrl)
      ? { type: "validate", message: "Must be a valid https:// URL" }
      : undefined;

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
            Enter a URL below and scan the preview QR code to test it. Changes
            here aren&apos;t saved — your URL is stored when you submit for
            review.
          </Typography>
        </div>

        {loading ? (
          <Skeleton height={56} />
        ) : (
          <FloatingInput
            id="test_app_url"
            label="Test App URL"
            value={testUrl}
            onChange={(event) => setTestUrl(event.target.value)}
            onBlur={() => {
              const inferred = inferHttps(testUrl);
              if (inferred !== testUrl) {
                setTestUrl(inferred);
              }
            }}
            errors={testUrlError}
          />
        )}

        {isValidHttpsUrl(testUrl) && (
          <div className="flex justify-center">
            <QrQuickAction url={testUrl} showDraftMiniAppFlag={false} />
          </div>
        )}

        {showActualQr && (
          <div className="grid gap-y-6 border-t border-grey-100 pt-8">
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.H6} className="font-normal">
                Submitted app
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                {isVerified
                  ? "This is your live App URL. Scan to open your mini app in World App."
                  : "Your app is under review. This is the URL being reviewed — un-submit to change it."}
              </Typography>
            </div>

            <FloatingInput
              id="actual_app_url"
              label="App URL"
              value={appMetadata?.integration_url ?? ""}
              disabled
              readOnly
            />

            <div className="flex justify-center">
              <QrQuickAction
                url={actualMiniAppUrl}
                showDraftMiniAppFlag={!isVerified}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
