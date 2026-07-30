"use client";

import { getCDNImageUrl } from "@/lib/utils";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useAtomValue } from "jotai";
import { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { useAppStoreFormContext } from "../AppStore/app-store";
import { basicInfoDraftAtom } from "../BasicInformation";
import { unverifiedImageAtom } from "../layout/ImagesProvider";

const MetaCard = (props: { label: string; children: ReactNode }) => (
  <div className="flex w-60 flex-col items-start">
    <div className="flex w-full flex-col items-start gap-1">
      {/* Figma nucleus/foreground-secondary (#7d7d7d) — no portal token yet. */}
      <p className="text-17 leading-[1.3] font-[350] whitespace-nowrap text-[#7d7d7d]">
        {props.label}
      </p>
      {props.children}
    </div>
  </div>
);

/**
 * Step 4 of the configuration wizard: a store-listing style summary of what
 * the earlier steps collected, reading live values from the shared form and
 * the unverified-image atom so edits show up without a save round-trip.
 * Rating and the Humans row are the design's static placeholders until real
 * data sources are decided.
 */
export const ReviewStep = (props: {
  teamName: string;
  isMiniApp: boolean;
  logoUrl?: string;
}) => {
  const { control, appMetadata, appId } = useAppStoreFormContext();
  const basicInfoDraft = useAtomValue(basicInfoDraftAtom);
  const unverifiedImages = useAtomValue(unverifiedImageAtom);
  const isVerified = appMetadata.verification_status === "verified";

  const localisations = useWatch({ control, name: "localisations" }) ?? [];
  const en = localisations.find((l) => l.language === "en");

  const name = basicInfoDraft.name || appMetadata.name || "";
  const tagline =
    (props.isMiniApp && en?.world_app_description) ||
    appMetadata.world_app_description ||
    "A one-line summary of your app";
  const description = en?.description_overview ?? "";

  const showcasePaths = (en?.showcase_img_urls ?? []).filter(
    (path): path is string => Boolean(path),
  );
  const showcaseUrls = showcasePaths
    .map((path) => {
      if (isVerified) return getCDNImageUrl(appId, path, true, "en");
      return (unverifiedImages.showcase_image_urls ?? []).find((url: string) =>
        url.includes(path),
      );
    })
    .filter((url): url is string => Boolean(url));

  // Always render at least the design's two placeholder tiles.
  const showcaseSlots = Math.max(2, showcaseUrls.length);

  return (
    <div className="flex w-full flex-col items-start">
      <div className="size-[88px] overflow-clip rounded-[20px] border border-portal-border bg-portal-canvas">
        {props.logoUrl && (
          <img
            src={props.logoUrl}
            alt="App logo"
            className="pointer-events-none size-full object-cover"
          />
        )}
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <h1 className="text-[34px] leading-[1.2] font-[550] tracking-[-0.51px] whitespace-nowrap text-portal-text">
          {name}
        </h1>
        <p className="text-17 leading-[1.3] font-[350] text-portal-text">
          {tagline}
        </p>
      </div>

      <div className="mt-10 flex w-full flex-col gap-14">
        <div className="flex w-full flex-wrap content-center items-center gap-[43px]">
          <MetaCard label="Rating">
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Icon key={index} name="star" className="size-5" />
                ))}
              </div>
              <p className="text-15 leading-[1.3] font-[350] whitespace-nowrap text-portal-ink">
                0
              </p>
            </div>
          </MetaCard>

          <MetaCard label="Built by">
            <p className="text-15 leading-[1.3] font-[350] whitespace-nowrap text-portal-ink">
              {props.teamName}
            </p>
          </MetaCard>

          <MetaCard label="Platform">
            <p className="text-15 leading-[1.3] font-[350] whitespace-nowrap text-portal-ink">
              {props.isMiniApp ? "Mini App" : "External App"}
            </p>
          </MetaCard>

          <MetaCard label="Humans">
            <p className="text-15 leading-[1.3] font-[350] whitespace-nowrap text-portal-ink">
              Available at launch
            </p>
          </MetaCard>
        </div>

        {description && (
          <p className="w-full text-17 leading-[1.3] font-[350] text-portal-text">
            {description}
          </p>
        )}

        <div className="flex w-full items-start gap-[8.534px]">
          {Array.from({ length: showcaseSlots }, (_, index) => {
            const url = showcaseUrls[index];
            return url ? (
              <img
                key={index}
                src={url}
                alt=""
                className="h-[203px] min-w-px flex-1 rounded-[10px] object-cover"
              />
            ) : (
              <div
                key={index}
                className="flex h-[203px] min-w-px flex-1 items-center justify-center overflow-clip rounded-[10px] border border-dashed border-grey-200 bg-portal-canvas p-6"
              >
                {/* Figma Primary/Grey/500 (#717680) — no matching token. */}
                <p className="text-center text-13 leading-[1.3] font-[350] whitespace-nowrap text-[#717680]">
                  Showcase image
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
