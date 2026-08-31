"use client";

import { CopyButton } from "@/components/CopyButton";
import QRCode from "react-qr-code";

import {
  buildMiniAppDraftUrl,
  getSafeExternalIntegrationUrl,
} from "../preview-links";
import type { ReviewerAppMode } from "../types";

type ReviewerTestTargetProps = {
  appId: string;
  appName: string;
  compact?: boolean;
  integrationUrl: unknown;
  metadataId: string;
  mode: ReviewerAppMode;
};

export const ReviewerTestTarget = ({
  appId,
  appName,
  compact = false,
  integrationUrl,
  metadataId,
  mode,
}: ReviewerTestTargetProps) => {
  if (mode === "external") {
    const safeUrl = getSafeExternalIntegrationUrl(integrationUrl);

    return (
      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <p className="text-12 font-medium tracking-wide text-grey-400 uppercase">
          External integration
        </p>
        <p className="mt-2 text-14 font-semibold text-grey-900">{appName}</p>
        <h2 className="mt-1 text-18 font-semibold text-grey-900">
          Test in a standard browser
        </h2>
        <p className="mt-2 max-w-2xl text-13 leading-5 text-grey-500">
          External integrations are not Mini Apps. Review the submitted HTTPS
          integration directly; no World App QR is generated.
        </p>
        {safeUrl ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a
              className="rounded-8 bg-grey-900 px-4 py-2.5 text-13 font-semibold text-grey-0"
              href={safeUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open integration
            </a>
            <CopyButton
              className="rounded-8 border border-grey-200 bg-grey-0 p-2.5 pr-2.5"
              fieldName="integration URL"
              fieldValue={safeUrl}
            />
            <code className="min-w-0 rounded-8 bg-grey-50 px-3 py-2 text-12 break-all text-grey-700">
              {safeUrl}
            </code>
          </div>
        ) : (
          <p className="mt-5 rounded-8 bg-system-error-100 p-3 text-13 text-system-error-700">
            The submitted integration URL is not a valid HTTPS URL.
          </p>
        )}
      </section>
    );
  }

  const draftUrl = buildMiniAppDraftUrl(appId, metadataId);
  const qrContainerClass = compact
    ? "h-[88px] w-[88px]"
    : "min-h-[160px] min-w-[160px]";

  return (
    <section className="grid gap-6 rounded-12 border border-grey-200 bg-grey-0 p-5 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
      <div>
        <p className="text-12 font-medium tracking-wide text-grey-400 uppercase">
          Scan to test
        </p>
        <p className="mt-2 text-14 font-semibold text-grey-900">{appName}</p>
        <h2 className="mt-1 text-18 font-semibold text-grey-900">
          Test the exact metadata version
        </h2>
        <p className="mt-2 max-w-xl text-13 leading-5 text-grey-500">
          This link includes the immutable draft ID. Scan it in World App or
          open it on a device with World App installed.
        </p>
        <code className="mt-4 block rounded-8 bg-grey-50 p-3 text-12 break-all text-grey-700">
          {draftUrl}
        </code>
        <div className="mt-4 flex gap-2">
          <a
            className="rounded-8 bg-grey-900 px-4 py-2.5 text-13 font-semibold text-grey-0"
            href={draftUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open in World App
          </a>
          <CopyButton
            className="rounded-8 border border-grey-200 bg-grey-0 p-2.5 pr-2.5"
            fieldName="draft link"
            fieldValue={draftUrl}
          />
        </div>
      </div>
      <div
        className={`rounded-12 border border-grey-200 bg-white p-4 ${qrContainerClass}`}
      >
        <QRCode
          aria-label="World App draft QR code"
          className="h-auto w-full"
          value={draftUrl}
          viewBox="0 0 256 256"
        />
      </div>
    </section>
  );
};
