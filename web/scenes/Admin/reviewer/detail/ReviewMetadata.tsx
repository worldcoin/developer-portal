"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ReviewerAsset, ReviewerSubmissionDetail } from "../types";

const FALLBACK_ASSET_DIMENSIONS: Record<
  ReviewerAsset["kind"],
  { height: number; width: number }
> = {
  content_card: { width: 16, height: 9 },
  hero: { width: 16, height: 9 },
  logo: { width: 1, height: 1 },
  meta_tag: { width: 1200, height: 630 },
  showcase: { width: 9, height: 16 },
};

const assetDimensions = (asset: ReviewerAsset) =>
  Number.isFinite(asset.width) &&
  Number.isFinite(asset.height) &&
  (asset.width ?? 0) > 0 &&
  (asset.height ?? 0) > 0
    ? { width: asset.width!, height: asset.height! }
    : FALLBACK_ASSET_DIMENSIONS[asset.kind];

const humanize = (key: string) =>
  key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="grid gap-1">
        {value.map((item, index) => (
          <li className="break-all" key={`${String(item)}:${index}`}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    ) : (
      "None"
    );
  }
  if (typeof value === "object") {
    return (
      <pre className="overflow-auto text-11 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return String(value);
};

const MetadataGrid = ({ record }: { record: Record<string, unknown> }) => (
  <dl className="grid gap-px overflow-hidden rounded-8 border border-grey-200 bg-grey-200 sm:grid-cols-2">
    {Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => (
        <div className="min-w-0 bg-grey-0 p-3" key={key}>
          <dt className="text-11 font-medium tracking-wide text-grey-400 uppercase">
            {humanize(key)}
          </dt>
          <dd className="text-grey-800 mt-1 text-12 leading-5 break-words">
            {displayValue(value)}
          </dd>
        </div>
      ))}
  </dl>
);

export const ReviewMetadata = ({
  submission,
}: {
  submission: ReviewerSubmissionDetail;
}) => {
  const [assets, setAssets] = useState<ReviewerAsset[]>([]);
  const [assetsUnavailable, setAssetsUnavailable] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const assetRequestRef = useRef<AbortController | null>(null);

  const loadAssets = useCallback(async () => {
    assetRequestRef.current?.abort();
    const controller = new AbortController();
    assetRequestRef.current = controller;
    setAssetsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reviewer/submissions/${submission.id}/assets`,
        { cache: "no-store", signal: controller.signal },
      );
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { assets?: ReviewerAsset[] };
      if (!Array.isArray(payload.assets)) throw new Error();
      setAssets(payload.assets);
      setAssetsUnavailable(false);
    } catch {
      if (controller.signal.aborted) return;
      setAssetsUnavailable(true);
    } finally {
      if (assetRequestRef.current === controller) {
        assetRequestRef.current = null;
        setAssetsLoading(false);
      }
    }
  }, [submission.id]);

  useEffect(() => {
    void loadAssets();
    const interval = window.setInterval(loadAssets, 10 * 60 * 1000);
    return () => {
      window.clearInterval(interval);
      const activeRequest = assetRequestRef.current;
      assetRequestRef.current = null;
      activeRequest?.abort();
    };
  }, [loadAssets]);

  return (
    <div className="grid gap-5">
      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">
          Canonical submitted metadata
        </h2>
        <p className="mt-1 text-12 text-grey-500">
          Immutable snapshot captured when the developer submitted this attempt.
        </p>
        <div className="mt-4">
          <MetadataGrid record={submission.metadataSnapshot} />
        </div>
      </section>

      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">Localizations</h2>
        <div className="mt-4 grid gap-4">
          {submission.localizationsSnapshot.length ? (
            submission.localizationsSnapshot.map((localization, index) => (
              <article
                className="rounded-8 border border-grey-200 p-4"
                key={`${String(localization.locale)}:${index}`}
              >
                <h3 className="mb-3 text-13 font-semibold text-grey-900">
                  {String(localization.locale ?? "Unknown locale")}
                </h3>
                <MetadataGrid record={localization} />
              </article>
            ))
          ) : (
            <p className="text-13 text-grey-500">
              No localized rows submitted.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">
          Submitted assets
        </h2>
        {assetsUnavailable ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-8 bg-system-warning-100 p-3 text-12 text-system-warning-700">
            <p>
              Signed asset previews are unavailable. Metadata filenames remain
              in the canonical snapshot above.
            </p>
            <button
              className="rounded-8 border border-system-warning-300 px-3 py-1.5 font-semibold"
              onClick={loadAssets}
              type="button"
            >
              Retry previews
            </button>
          </div>
        ) : null}
        {assetsLoading ? (
          <p className="mt-3 text-12 text-grey-500">Loading fresh previews…</p>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <figure
              className="overflow-hidden rounded-8 border border-grey-200 bg-grey-50"
              key={asset.id}
            >
              {/* Signed URLs expire quickly and are rendered only after admin auth. */}
              {(() => {
                const dimensions = assetDimensions(asset);
                return (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt={`${asset.label}, ${asset.locale === "en" ? "English" : asset.locale}`}
                    className="w-full object-contain"
                    decoding="async"
                    height={dimensions.height}
                    loading="lazy"
                    src={asset.signedUrl}
                    style={{
                      aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                    }}
                    width={dimensions.width}
                  />
                );
              })()}
              <figcaption className="text-grey-600 border-t border-grey-200 bg-grey-0 p-3 text-11">
                {asset.label} · {asset.locale}
              </figcaption>
            </figure>
          ))}
          {!assets.length && !assetsUnavailable && !assetsLoading ? (
            <p className="text-13 text-grey-500">
              No image filenames submitted.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">
          World ID configuration
        </h2>
        <p className="mt-1 text-12 text-grey-500">
          Captured when this attempt was submitted, including registration
          status at that time.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-12 font-semibold text-grey-700">
              Legacy actions
            </h3>
            <div className="mt-2 grid gap-2">
              {submission.worldIdConfiguration.legacyActions.map((action) => (
                <div
                  className="rounded-8 bg-grey-50 p-3 text-12"
                  key={action.id}
                >
                  <MetadataGrid record={{ ...action }} />
                </div>
              ))}
              {!submission.worldIdConfiguration.legacyActions.length ? (
                <p className="text-12 text-grey-500">No legacy actions.</p>
              ) : null}
            </div>
          </div>
          <div>
            <h3 className="text-12 font-semibold text-grey-700">
              Relying parties and actions
            </h3>
            <div className="mt-2 grid gap-2">
              {submission.worldIdConfiguration.registrations.map(
                (registration) => (
                  <div
                    className="rounded-8 bg-grey-50 p-3 text-12"
                    key={registration.rpId}
                  >
                    <p className="font-mono font-medium text-grey-900">
                      {registration.rpId}
                    </p>
                    <div className="mt-2">
                      <MetadataGrid
                        record={{
                          mode: registration.mode,
                          signer_address: registration.signerAddress,
                          staging_status: registration.stagingStatus,
                          status: registration.status,
                        }}
                      />
                    </div>
                    {registration.actions.map((action) => (
                      <div className="mt-2" key={action.id}>
                        <MetadataGrid record={{ ...action }} />
                      </div>
                    ))}
                  </div>
                ),
              )}
              {!submission.worldIdConfiguration.registrations.length ? (
                <p className="text-12 text-grey-500">
                  No relying-party registration.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
