"use client";

import { getCDNImageUrl } from "@/lib/utils";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useWatch } from "react-hook-form";
import { selectedLanguageAtom } from "../AppStore/components/FormSections/LocalisationsSection/hooks/useLanguageSelection";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { basicInfoDraftAtom } from "../BasicInformation";
import { isMiniAppAtom, unverifiedImageAtom } from "../layout/ImagesProvider";

const ShowcaseSlot = ({ url }: { url?: string }) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Showcase preview"
      className="aspect-16/10 w-full rounded-xl object-cover"
    />
  ) : (
    <div className="aspect-16/10 w-full rounded-xl border border-dashed border-grey-300 bg-grey-50" />
  );

type LivePreviewProps = {
  appId: string;
  teamName: string;
  appMetadata: {
    verification_status: string;
    logo_img_url?: string | null;
    showcase_img_urls?: string[] | null;
  };
};

const getImageUrl = (
  appId: string,
  path: string | null | undefined,
  isVerified: boolean,
) => {
  if (!path || path === "loading") {
    return "";
  }

  return path.startsWith("http")
    ? path
    : getCDNImageUrl(appId, path, isVerified);
};

/**
 * Live, responsive HTML replica of the public World App Store listing page,
 * fed by the form values as the user types — laid out like the real listing
 * rendered at the pane's width. Listing bits the portal can't edit (rating,
 * humans count, button label) render as neutral static placeholders.
 */
export const LivePreview = ({
  appId,
  teamName,
  appMetadata,
}: LivePreviewProps) => {
  const basicInfo = useAtomValue(basicInfoDraftAtom);
  const images = useAtomValue(unverifiedImageAtom);
  const isMiniApp = useAtomValue(isMiniAppAtom);
  const localisations = useWatch<AppStoreFormValues, "localisations">({
    name: "localisations",
  });

  // Follow the locale being edited in Localized content, falling back to
  // English so the preview never goes blank.
  const selectedLanguage = useAtomValue(selectedLanguageAtom);
  const loc =
    localisations?.find((l) => l?.language === selectedLanguage) ??
    localisations?.find((l) => l?.language === "en");
  const enteredName = basicInfo.name?.trim() || loc?.name?.trim() || "";
  const name = enteredName || "Untitled app";
  const tagLine = isMiniApp
    ? (selectedLanguage === "en"
        ? basicInfo.world_app_description
        : loc?.world_app_description
      )?.trim() || ""
    : "";
  const description = loc?.description_overview?.trim() || "";
  const isVerified = appMetadata.verification_status === "verified";
  const atomLogoImgUrl =
    images.logo_img_url && images.logo_img_url !== "loading"
      ? images.logo_img_url
      : "";
  const metadataLogoImgUrl = getImageUrl(
    appId,
    appMetadata.logo_img_url,
    isVerified,
  );
  const logoImgUrl = isVerified
    ? metadataLogoImgUrl
    : atomLogoImgUrl || metadataLogoImgUrl;
  const metadataShowcaseUrls = (appMetadata.showcase_img_urls ?? [])
    .map((path) => getImageUrl(appId, path, isVerified))
    .filter(Boolean);
  const showcaseUrls = isVerified
    ? metadataShowcaseUrls
    : images.showcase_image_urls ?? metadataShowcaseUrls;
  const hasWebsite = Boolean(basicInfo.app_website_url?.trim());

  return (
    // Strictly inert: the replica is a picture of the listing, not a second
    // set of controls — nothing here reacts to hover, click, or selection.
    // Wheel scrolling still works because events fall through to the
    // scroll container behind it.
    <div className="pointer-events-none grid w-full content-start gap-y-8 select-none">
      {/* Logo */}
      {logoImgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoImgUrl}
          alt="App logo preview"
          className="size-16 rounded-2xl object-cover"
        />
      ) : (
        <div className="size-16 rounded-2xl border border-dashed border-grey-300 bg-grey-50" />
      )}

      {/* Name + tag line, button on the right */}
      <div className="flex items-center justify-between gap-x-6">
        <div className="grid min-w-0 gap-y-1">
          <span
            className={clsx(
              "truncate text-3xl",
              enteredName ? "text-grey-900" : "text-grey-300",
            )}
          >
            {name}
          </span>
          <span className="truncate text-base text-grey-500">{tagLine}</span>
        </div>
        <span className="shrink-0 rounded-full bg-grey-900 px-4 py-2 text-sm whitespace-nowrap text-white">
          {isMiniApp ? "Open Mini App" : "Use Integration"}
        </span>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {(
          [
            ["Rating", "Not yet rated"],
            ["Built by", teamName],
            ["Platform", isMiniApp ? "Mini App" : "External"],
            ["Humans", "Counted after launch"],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="grid gap-y-0.5">
            <span className="text-xs text-grey-400">{label}</span>
            <span className="truncate text-sm text-grey-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Description — omitted until the user writes one, like the real
          listing before launch. */}
      {description && (
        <p className="line-clamp-6 text-sm leading-relaxed whitespace-pre-line text-grey-900">
          {description}
        </p>
      )}

      {/* Showcase images */}
      <div className="grid grid-cols-2 gap-x-3">
        <ShowcaseSlot url={showcaseUrls[0] ?? undefined} />
        <ShowcaseSlot url={showcaseUrls[1] ?? undefined} />
      </div>

      {/* Footer chips */}
      <div className="flex gap-x-2">
        <span
          className={
            "rounded-full border px-3 py-1 text-xs " +
            (hasWebsite
              ? "border-grey-300 text-grey-900"
              : "border-grey-200 text-grey-300")
          }
        >
          Website
        </span>
        <span className="rounded-full border border-grey-300 px-3 py-1 text-xs text-grey-900">
          Report
        </span>
      </div>
    </div>
  );
};
