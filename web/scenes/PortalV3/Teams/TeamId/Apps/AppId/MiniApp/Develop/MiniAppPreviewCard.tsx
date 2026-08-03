"use client";

import { CopyButton } from "@/components/CopyButton";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

type AppMetadata = FetchAppMetadataQuery["app"][0]["app_metadata"][0];

export const MiniAppPreviewCard = ({
  appId,
  teamId,
  appMetadata,
}: {
  appId: string;
  teamId: string;
  appMetadata?: AppMetadata;
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const isDraft = appMetadata?.verification_status !== "verified";
  const draftQuery =
    isDraft && appMetadata?.id ? `&draft_id=${appMetadata.id}` : "";
  const miniAppUrl = `https://world.org/mini-app?app_id=${appId}&path=${draftQuery}`;
  const isExternalApp = appMetadata?.app_mode === "external";
  const hasPreview = Boolean(appMetadata?.integration_url) && !isExternalApp;

  useEffect(() => {
    if (!hasPreview) {
      setQrCodeDataUrl(null);
      return;
    }

    let cancelled = false;
    setQrCodeDataUrl(null);
    QRCode.toDataURL(miniAppUrl, { width: 512, margin: 1 })
      .then((dataUrl) => {
        if (!cancelled) setQrCodeDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setQrCodeDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hasPreview, miniAppUrl]);

  if (isExternalApp) {
    return (
      <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
          <AlertIcon className="size-4 text-white" />
        </div>
        <Typography
          variant={TYPOGRAPHY.B3}
          className="flex-1 text-system-warning-600"
        >
          Mini App preview becomes available when this app is set to Mini App in{" "}
          <Link
            href={urls.configuration({ team_id: teamId, app_id: appId })}
            className="underline"
          >
            Get Verified
          </Link>
          .
        </Typography>
      </div>
    );
  }

  if (!hasPreview) {
    return (
      <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
          <AlertIcon className="size-4 text-white" />
        </div>
        <Typography
          variant={TYPOGRAPHY.B3}
          className="flex-1 text-system-warning-600"
        >
          Add a valid App URL to enable the QR code preview.
        </Typography>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-200 bg-grey-0 shadow-button">
      <div className="flex items-start justify-between gap-x-3 p-5">
        <div className="flex items-center gap-x-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <FlaskIcon className="size-5" />
          </div>

          <div className="grid gap-y-0.5">
            <Typography
              as="p"
              className="font-world text-[15px] leading-[120%] font-semibold text-grey-900"
            >
              Mini App preview
            </Typography>

            <Typography
              as="p"
              className="font-world text-[13px] leading-[130%] font-medium text-grey-500"
            >
              Scan or copy the preview link
            </Typography>
          </div>
        </div>

        <CopyButton
          fieldName="Mini App preview link"
          fieldValue={miniAppUrl}
          className="rounded-lg border border-grey-200 p-2 pr-2! hover:bg-grey-50"
          iconClassName="size-4 text-grey-700"
        />
      </div>

      <div className="px-6 pb-6">
        {qrCodeDataUrl ? (
          <Image
            src={qrCodeDataUrl}
            width={512}
            height={512}
            alt="Mini App preview QR code"
            className="h-auto w-full"
            unoptimized
          />
        ) : (
          <div className="aspect-square w-full">
            <Skeleton height="100%" containerClassName="block h-full" />
          </div>
        )}
      </div>
    </div>
  );
};
