"use client";

import { CopyButton } from "@/components/CopyButton";
import QRCode from "react-qr-code";
import { useId, useState } from "react";

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
  layout?: "responsive" | "stacked";
  metadataId: string;
  mode: ReviewerAppMode;
};

export const ReviewerTestTarget = ({
  appId,
  appName,
  compact = false,
  integrationUrl,
  layout = "responsive",
  metadataId,
  mode,
}: ReviewerTestTargetProps) => {
  const [compactExpanded, setCompactExpanded] = useState(false);
  const expandedTargetId = useId();

  if (mode === "external") {
    const safeUrl = getSafeExternalIntegrationUrl(integrationUrl);

    if (compact) {
      return (
        <section className="grid min-w-0 gap-3 rounded-12 border border-grey-200 bg-grey-0 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-10 font-medium tracking-wide text-grey-400 uppercase">
              External integration
            </p>
            <p className="mt-1 truncate text-14 font-semibold text-grey-900">
              {appName}
            </p>
            {safeUrl ? (
              <code className="mt-2 block min-w-0 text-11 break-all text-grey-700">
                {safeUrl}
              </code>
            ) : null}
          </div>
          {safeUrl ? (
            <div className="flex shrink-0 items-center gap-2">
              <a
                className="inline-flex min-h-11 items-center rounded-8 bg-grey-900 px-3 text-12 font-semibold text-grey-0"
                href={safeUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open integration
              </a>
              <CopyButton
                className="min-h-11 min-w-11 rounded-8 border border-grey-200 bg-grey-0 p-2.5 pr-2.5"
                fieldName="integration URL"
                fieldValue={safeUrl}
              />
            </div>
          ) : (
            <p className="max-w-40 text-11 leading-4 text-system-error-700">
              The submitted integration URL is not a valid HTTPS URL.
            </p>
          )}
        </section>
      );
    }

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

  if (compact) {
    return (
      <div className="grid gap-2">
        <section className="flex min-w-0 items-center gap-3 rounded-12 border border-grey-200 bg-grey-0 p-3">
          <button
            aria-controls={expandedTargetId}
            aria-expanded={compactExpanded}
            aria-label={`${compactExpanded ? "Hide" : "Show"} full Mini App test target`}
            className="h-[88px] w-[88px] shrink-0 cursor-pointer rounded-8 border border-grey-200 bg-white p-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setCompactExpanded((expanded) => !expanded)}
            type="button"
          >
            <QRCode
              aria-label="World App draft QR code"
              className="h-auto w-full"
              value={draftUrl}
              viewBox="0 0 256 256"
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-10 font-medium tracking-wide text-grey-400 uppercase">
              Scan to test
            </p>
            <p className="mt-1 truncate text-14 font-semibold text-grey-900">
              {appName}
            </p>
            <a
              className="mt-2 inline-flex min-h-11 items-center rounded-8 bg-grey-900 px-3 text-12 font-semibold text-grey-0"
              href={draftUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open in World App
            </a>
          </div>
        </section>
        <div hidden={!compactExpanded} id={expandedTargetId}>
          {compactExpanded ? (
            <ReviewerTestTarget
              appId={appId}
              appName={appName}
              integrationUrl={integrationUrl}
              layout="stacked"
              metadataId={metadataId}
              mode={mode}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section
      className={`grid gap-6 rounded-12 border border-grey-200 bg-grey-0 p-5 ${
        layout === "stacked"
          ? "grid-cols-1"
          : "md:grid-cols-[minmax(0,1fr)_240px] md:items-center"
      }`}
    >
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
        className={`min-h-[160px] min-w-[160px] rounded-12 border border-grey-200 bg-white p-4 ${
          layout === "stacked" ? "w-full max-w-[240px] justify-self-center" : ""
        }`}
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
