"use client";

import type { ApolloCache } from "@apollo/client/cache";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { FetchImagesDocument } from "../../graphql/client/fetch-images.generated";
import {
  useAppImageUpload,
  type UnverifiedImages,
} from "../../hook/use-app-image-upload";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
} from "../graphql/client/fetch-localisations.generated";
import { UpsertLocalisedMetaTagImageDocument } from "../graphql/client/upsert-localised-meta-tag-image.generated";
import { UpsertLocalisedShowcaseImagesDocument } from "../graphql/client/upsert-localised-showcase-images.generated";

type LocalisationRow = FetchLocalisationsQuery["localisations"][number];

/**
 * The one FetchImages subscription for a locale's image fields. Sections call
 * this once and hand the result to both the showcase and meta-tag fields, so
 * sibling fields don't each run their own copy of the query.
 */
export const useUnverifiedImages = ({
  appId,
  teamId,
  locale,
}: {
  appId: string;
  teamId: string;
  locale?: string;
}) => {
  const isLocalized = locale !== undefined && locale !== "en";
  const { data, loading } = useQuery(FetchImagesDocument, {
    variables: {
      id: appId,
      team_id: teamId,
      locale: isLocalized ? locale : undefined,
    },
  });

  return {
    unverifiedImages: data?.unverified_images ?? null,
    // Guard on data too: a refetch elsewhere flips `loading` on and this must
    // not swap already-rendered previews for skeletons.
    isImagesLoading: loading && !data,
  };
};

/**
 * Keep the FetchLocalisations cache in step with what the dedicated image
 * mutation just wrote, so a later form remount seeds from correct data
 * without refetching. Missing rows are appended the way the upsert's
 * insert-on-conflict creates them (image fields set, text fields empty).
 */
const patchLocalisationsCache = (
  cache: ApolloCache,
  appMetadataId: string,
  locale: string,
  patch: Partial<Pick<LocalisationRow, "meta_tag_image_url">> &
    Partial<Pick<LocalisationRow, "showcase_img_urls">>,
) => {
  cache.updateQuery(
    {
      query: FetchLocalisationsDocument,
      variables: { app_metadata_id: appMetadataId },
    },
    (data) => {
      if (!data) return null;
      const rows = data.localisations ?? [];
      if (rows.some((row) => row.locale === locale)) {
        return {
          localisations: rows.map((row) =>
            row.locale === locale ? { ...row, ...patch } : row,
          ),
        };
      }
      return {
        localisations: [
          ...rows,
          {
            __typename: "localisations" as const,
            locale,
            name: "",
            description: "",
            world_app_button_text: "",
            world_app_description: "",
            short_name: "",
            hero_image_url: "",
            meta_tag_image_url: "",
            showcase_img_urls: null,
            ...patch,
          },
        ],
      };
    },
  );
};

type LocalisedImageFieldArgs = {
  kind: "meta_tag" | "showcase";
  appId: string;
  teamId: string;
  /** Selected language; "en" writes the app_metadata columns directly. */
  locale: string;
  appMetadataId?: string;
  supportedLanguages: string[];
  /** Committed metadata paths currently held by the form. */
  value: string[];
  /**
   * Install committed paths into the form without scheduling the whole-form
   * autosave — the dedicated mutation is the persistence owner.
   */
  installValue: (paths: string[]) => void;
  /** Existing per-surface error UX for the upload pipeline. */
  onUploadError?: (error: unknown) => void;
  onPersistSuccess?: () => void;
  onPersistError?: (error: unknown) => void;
};

/**
 * Shared behavior for the showcase / meta-tag image fields in both Portal
 * trees: the optimistic-preview upload transaction plus the delete
 * transaction, with all state committed locally (React Hook Form + Apollo
 * cache) instead of refetching.
 */
export const useLocalisedImageField = ({
  kind,
  appId,
  teamId,
  locale,
  appMetadataId,
  supportedLanguages,
  value,
  installValue,
  onUploadError,
  onPersistSuccess,
  onPersistError,
}: LocalisedImageFieldArgs) => {
  const isLocalized = locale !== "en";
  const client = useApolloClient();

  const {
    upload,
    isUploading,
    pendingPreviewUrl,
    patchImagesCache,
    readImagesCache,
  } = useAppImageUpload({
    appId,
    teamId,
    locale: isLocalized ? locale : undefined,
  });

  const [upsertMetaTagImage] = useMutation(UpsertLocalisedMetaTagImageDocument);
  const [upsertShowcaseImages] = useMutation(
    UpsertLocalisedShowcaseImagesDocument,
  );

  const persist = useCallback(
    async (paths: string[]) => {
      if (!appMetadataId) {
        throw new Error("App metadata is unavailable");
      }
      const shared = {
        app_metadata_id: appMetadataId,
        supported_languages: supportedLanguages,
        locale: isLocalized ? locale : undefined,
        is_localized: isLocalized,
      };
      try {
        if (kind === "meta_tag") {
          await upsertMetaTagImage({
            variables: { ...shared, meta_tag_image_url: paths[0] ?? "" },
          });
        } else {
          await upsertShowcaseImages({
            variables: { ...shared, showcase_img_urls: paths },
          });
        }
        onPersistSuccess?.();
      } catch (error) {
        onPersistError?.(error);
        throw error;
      }
    },
    [
      appMetadataId,
      supportedLanguages,
      isLocalized,
      locale,
      kind,
      upsertMetaTagImage,
      upsertShowcaseImages,
      onPersistSuccess,
      onPersistError,
    ],
  );

  /**
   * Write the committed paths + preview URLs into every local store: the
   * FetchImages entry previews render from, the FetchLocalisations rows a
   * remounted form seeds from (the non-localized mutation already returns the
   * updated app_metadata columns), and the form value itself.
   */
  const commitState = useCallback(
    (paths: string[], previewUrls: string[]) => {
      patchImagesCache(() =>
        kind === "meta_tag"
          ? { meta_tag_image_url: previewUrls[0] ?? null }
          : { showcase_img_urls: previewUrls },
      );
      if (isLocalized && appMetadataId) {
        patchLocalisationsCache(
          client.cache,
          appMetadataId,
          locale,
          kind === "meta_tag"
            ? { meta_tag_image_url: paths[0] ?? "" }
            : { showcase_img_urls: paths },
        );
      }
      installValue(paths);
    },
    [
      patchImagesCache,
      kind,
      isLocalized,
      appMetadataId,
      client,
      locale,
      installValue,
    ],
  );

  const currentPreviewUrls = useCallback(
    (images: UnverifiedImages | null): string[] => {
      if (kind === "meta_tag") {
        const url = images?.meta_tag_image_url;
        return url ? [url] : [];
      }
      return images?.showcase_img_urls ?? [];
    },
    [kind],
  );

  const uploadFile = useCallback(
    (file: File, imageType: string) =>
      upload({
        file,
        imageType,
        persist: (fileName) =>
          persist(kind === "meta_tag" ? [fileName] : [...value, fileName]),
        commit: ({ fileName, signedUrl }) => {
          if (kind === "meta_tag") {
            commitState([fileName], [signedUrl]);
          } else {
            commitState(
              [...value, fileName],
              [...currentPreviewUrls(readImagesCache()), signedUrl],
            );
          }
        },
        onError: onUploadError,
      }),
    [
      upload,
      persist,
      kind,
      value,
      commitState,
      currentPreviewUrls,
      readImagesCache,
      onUploadError,
    ],
  );

  const deleteImage = useCallback(
    async (imagePath: string) => {
      const previousPaths = value;
      const previousPreviewUrls = currentPreviewUrls(readImagesCache());
      const newPaths = value.filter((path) => !path.includes(imagePath));
      const newPreviewUrls = previousPreviewUrls.filter(
        (url) => !url.includes(imagePath),
      );

      commitState(newPaths, newPreviewUrls);
      try {
        await persist(newPaths);
      } catch {
        // persist already routed the error to onPersistError; restore state.
        commitState(previousPaths, previousPreviewUrls);
      }
    },
    [value, currentPreviewUrls, readImagesCache, commitState, persist],
  );

  return { isUploading, pendingPreviewUrl, uploadFile, deleteImage };
};

export type { UnverifiedImages };
