"use client";

import { tryParseJSON } from "@/lib/utils";
import type { ApolloCache } from "@apollo/client/cache";
import { useApolloClient } from "@apollo/client/react";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FetchImagesDocument,
  FetchImagesQuery,
} from "../graphql/client/fetch-images.generated";
import { GetUploadedImageDocument } from "./graphql/client/get-uploaded-image.generated";
import { UploadImageDocument } from "./graphql/client/upload-image.generated";

export type UnverifiedImages = NonNullable<
  FetchImagesQuery["unverified_images"]
>;

const toFileName = (imageType: string, file: File) => {
  const ending = file.type.split("/")[1];
  return `${imageType}.${ending === "jpeg" ? "jpg" : ending}`;
};

// fetch() abort rejects with a DOMException named AbortError, which is not
// `instanceof Error` in every runtime — match on the name.
const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name: unknown }).name === "AbortError";

/**
 * Locally patch the FetchImages entry that previews render from (directly in
 * the image fields, and via ImagesProvider's atom for the logo / content
 * card). This is the only write path on upload success — no refetch.
 */
export const patchUnverifiedImagesCache = (
  cache: ApolloCache,
  { appId, teamId, locale }: { appId: string; teamId: string; locale?: string },
  patch: (current: UnverifiedImages | null) => Partial<UnverifiedImages>,
) => {
  cache.updateQuery(
    {
      query: FetchImagesDocument,
      variables: { id: appId, team_id: teamId, locale },
    },
    (data) => {
      const current = data?.unverified_images ?? null;
      return {
        unverified_images: {
          __typename: "ImageGetAllUnverifiedImagesOutput" as const,
          logo_img_url: current?.logo_img_url ?? null,
          hero_image_url: current?.hero_image_url ?? null,
          meta_tag_image_url: current?.meta_tag_image_url ?? null,
          showcase_img_urls: current?.showcase_img_urls ?? null,
          content_card_image_url: current?.content_card_image_url ?? null,
          ...patch(current),
        },
      };
    },
  );
};

export type AppImageUploadArgs = {
  file: File;
  /** Stable draft basename without extension, e.g. "logo_img", "showcase_img_2". */
  imageType: string;
  /**
   * Persist the committed file name through the surface's dedicated image
   * mutation. Throwing here rolls the optimistic preview back.
   */
  persist: (fileName: string) => Promise<unknown>;
  /**
   * Install the committed file name + signed preview URL into the surface's
   * stores (React Hook Form value, FetchImages cache). Runs even if the
   * calling component unmounted — Apollo's cache outlives the component.
   */
  commit: (result: { fileName: string; signedUrl: string }) => void;
  /**
   * Show the blob preview in a shared store (e.g. the FetchImages cache for
   * surfaces whose preview renders far from this hook). Returns the restore
   * function used on rollback. Surfaces that render `pendingPreviewUrl`
   * in place can omit this.
   */
  applyOptimisticPreview?: (blobUrl: string) => () => void;
  onError?: (error: unknown) => void;
};

/**
 * The one image-upload transaction, shared by logo, content-card, meta-tag
 * and showcase uploads in both Portal trees:
 *
 * 1. show a `blob:` preview immediately;
 * 2. upload to the unverified S3 key via the presigned POST;
 * 3. fetch the signed preview URL;
 * 4. persist the file name through the dedicated image mutation;
 * 5. commit form state + Apollo cache locally (no reload, no refetch) and
 *    swap the blob for the signed URL;
 * 6. on any failure, restore the previous preview/value.
 *
 * Blob URLs are revoked once replaced, rolled back, or the transaction is
 * cancelled. Unmounting aborts only a still-running S3 POST; once S3 has the
 * bytes, persistence and commit always finish (the caller's form provider can
 * remount mid-flight) and no cancellation is reported.
 */
export const useAppImageUpload = ({
  appId,
  teamId,
  locale,
}: {
  appId: string;
  teamId: string;
  /** Localized locale ("es", …) or undefined for the root/en images. */
  locale?: string;
}) => {
  // Transport queries go through the client, not component-bound hooks: once
  // S3 has the bytes, the transaction must finish even if this component
  // unmounts mid-flight (hook-bound lazy queries would be aborted).
  const client = useApolloClient();

  const [isUploading, setIsUploading] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const uploadToS3 = useCallback(
    async (file: File, imageType: string, signal: AbortSignal) => {
      let response;
      try {
        // network-only: presigned URLs expire, a cached result is never useful.
        response = await client.query({
          query: UploadImageDocument,
          variables: {
            app_id: appId,
            image_type: imageType,
            content_type_ending: file.type.split("/")[1],
            team_id: teamId,
            locale,
          },
          fetchPolicy: "network-only",
        });
      } catch (error) {
        // Surface the server's error (e.g. missing AWS credentials on a local
        // stack) instead of a blind "failed" — it lands in the console/toast.
        throw new Error(
          error instanceof Error
            ? `Failed to get upload signed URL: ${error.message}`
            : "Failed to get upload signed URL",
        );
      }

      if (!response.data?.upload_image?.url) {
        throw new Error("Failed to get upload signed URL");
      }

      const { url, stringifiedFields } = response.data.upload_image;
      const fields = tryParseJSON(stringifiedFields);
      if (!fields) {
        throw new Error("Failed to parse fields");
      }

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value as string),
      );
      formData.append("Content-Type", file.type);
      formData.append("file", file);

      const uploadResponse = await fetch(url, {
        method: "POST",
        body: formData,
        signal,
      });

      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        // The presigned POST goes browser → S3 without touching our servers,
        // so this failure is invisible to server logs — emit it from the
        // client.
        posthog.capture("image_upload_failed", {
          app_id: appId,
          team_id: teamId,
          image_type: imageType,
          status: uploadResponse.status,
        });
        throw new Error(
          `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`,
        );
      }
    },
    [appId, teamId, locale, client],
  );

  const getSignedUrl = useCallback(
    async (file: File, imageType: string) => {
      const response = await client.query({
        query: GetUploadedImageDocument,
        variables: {
          app_id: appId,
          image_type: imageType,
          content_type_ending: file.type.split("/")[1],
          team_id: teamId,
          locale,
        },
        fetchPolicy: "network-only",
      });

      const signedUrl = response.data?.get_uploaded_image?.url;
      if (!signedUrl) {
        throw new Error("Failed to get presigned URL");
      }
      return signedUrl;
    },
    [appId, teamId, locale, client],
  );

  const upload = useCallback(
    async ({
      file,
      imageType,
      persist,
      commit,
      applyOptimisticPreview,
      onError,
    }: AppImageUploadArgs): Promise<boolean> => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      // Flips once S3 accepts the file: aborts after this point are unmount
      // bookkeeping, NOT a cancelled upload — don't toast for them.
      let s3UploadCompleted = false;

      const blobUrl = URL.createObjectURL(file);
      setPendingPreviewUrl(blobUrl);
      const restorePreview = applyOptimisticPreview?.(blobUrl);

      const settle = (rollback: boolean) => {
        if (rollback) restorePreview?.();
        setPendingPreviewUrl(null);
        // Revoke only after the stores stop referencing the blob (commit or
        // restore above) so no mounted <img> re-renders against a dead URL.
        URL.revokeObjectURL(blobUrl);
      };

      try {
        setIsUploading(true);

        await uploadToS3(file, imageType, abortController.signal);
        s3UploadCompleted = true;
        // File is on S3 — an unmount abort() must not cancel the remaining
        // bookkeeping. Persistence is ownerless from here on; only the
        // isUploading flag below is gated on being mounted.
        abortControllerRef.current = null;

        const signedUrl = await getSignedUrl(file, imageType);
        const fileName = toFileName(imageType, file);

        await persist(fileName);
        commit({ fileName, signedUrl });
        settle(false);
        return true;
      } catch (error) {
        settle(true);
        if (isAbortError(error)) {
          if (!s3UploadCompleted) {
            toast.error("Upload was cancelled", { autoClose: 5000 });
          }
          return false;
        }
        console.error("error uploading image:", error);
        onError?.(error);
        return false;
      } finally {
        abortControllerRef.current = null;
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [uploadToS3, getSignedUrl],
  );

  const patchImagesCache = useCallback(
    (patch: (current: UnverifiedImages | null) => Partial<UnverifiedImages>) =>
      patchUnverifiedImagesCache(
        client.cache,
        { appId, teamId, locale },
        patch,
      ),
    [client, appId, teamId, locale],
  );
  const readImagesCache = useCallback((): UnverifiedImages | null => {
    return (
      client.readQuery({
        query: FetchImagesDocument,
        variables: { id: appId, team_id: teamId, locale },
      })?.unverified_images ?? null
    );
  }, [client, appId, teamId, locale]);

  return {
    upload,
    isUploading,
    /** Blob URL of the in-flight upload; render it as the immediate preview. */
    pendingPreviewUrl,
    /** Patch this surface's FetchImages cache entry (commit/rollback). */
    patchImagesCache,
    /** Snapshot this surface's FetchImages cache entry (capture-for-rollback). */
    readImagesCache,
  };
};
