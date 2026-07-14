"use client";

import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useFetchImagesLazyQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { useCreateEditableRowMutation } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/client/create-editable-row.generated";
import { useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";

type UseCreateNewDraftOptions = {
  appId: string;
  teamId: string;
  hasDraft: boolean;
  hasVerifiedVersion: boolean;
};

export const useCreateNewDraft = ({
  appId,
  teamId,
  hasDraft,
  hasVerifiedVersion,
}: UseCreateNewDraftOptions) => {
  const [createEditableRow] = useCreateEditableRowMutation();
  const [fetchImages] = useFetchImagesLazyQuery();
  const setUnverifiedImages = useSetAtom(unverifiedImageAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);

  const createNewDraft = useCallback(async () => {
    if (isCreatingRef.current) return false;

    if (hasDraft || !hasVerifiedVersion) {
      toast.error("A verified app without an active draft is required");
      return false;
    }

    isCreatingRef.current = true;
    setIsCreating(true);

    try {
      const result = await createEditableRow({
        variables: { app_id: appId, team_id: teamId },
        refetchQueries: [FetchAppMetadataDocument],
        awaitRefetchQueries: true,
      });

      if (!result.data?.create_new_draft?.success) {
        throw new Error("The draft mutation did not succeed");
      }

      try {
        const { data } = await fetchImages({
          variables: { id: appId, team_id: teamId },
        });

        setUnverifiedImages({
          logo_img_url: data?.unverified_images?.logo_img_url ?? "",
          showcase_image_urls: data?.unverified_images?.showcase_img_urls,
          meta_tag_image_url: data?.unverified_images?.meta_tag_image_url ?? "",
          content_card_image_url:
            data?.unverified_images?.content_card_image_url ?? "",
        });
      } catch (error) {
        // The draft already exists; ImagesProvider can retry this query in the
        // editor, so an image refresh should not strand the user here.
        console.error("Failed to refresh draft images", error);
      }
      setViewMode("unverified");
      toast.success("New app draft created");
      return true;
    } catch (error) {
      console.error("Failed to create a new draft", error);
      toast.error("Error creating a new draft");
      return false;
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [
    appId,
    createEditableRow,
    fetchImages,
    hasDraft,
    hasVerifiedVersion,
    setUnverifiedImages,
    setViewMode,
    teamId,
  ]);

  return { createNewDraft, isCreating };
};
