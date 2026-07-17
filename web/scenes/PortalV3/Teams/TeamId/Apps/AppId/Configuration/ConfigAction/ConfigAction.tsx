"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import { SubmitAppModal } from "../AppTopBar/SubmitAppModal";
import type { BasicInformationHandle } from "../BasicInformation";
import { unverifiedImageAtom, viewModeAtom } from "../layout/ImagesProvider";
import { ConfigActionButton } from "./ConfigActionButton";
import type { ConfigNextStep, FullAppMetadata } from "./types";

type ConfigActionProps = {
  appId: string;
  teamId: string;
  appMetadata: FullAppMetadata;
  nextStep?: ConfigNextStep;
  onContinue: () => void;
  basicInfoRef?: MutableRefObject<BasicInformationHandle | null>;
  onValidationError?: (fieldPath?: string) => void;
  className: string;
};

/**
 * Keeps the footer's primary action mounted across every step so Continue can
 * become Submit for review without resizing or replacing the button shell.
 */
export const ConfigAction = ({
  appId,
  teamId,
  appMetadata,
  nextStep,
  onContinue,
  basicInfoRef,
  onValidationError,
  className,
}: ConfigActionProps) => {
  const viewMode = useAtomValue(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const [showSubmitAppModal, setShowSubmitAppModal] = useState(false);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId, [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isEditable = appMetadata.verification_status === "unverified";
  const unverifiedImages = useAtomValue(unverifiedImageAtom);
  const showcaseImages =
    unverifiedImages.showcase_image_urls ?? appMetadata.showcase_img_urls;
  const hasRequiredImagesForAppStore = (showcaseImages?.length ?? 0) >= 1;

  if (!nextStep && (!isEditable || !isEnoughPermissions)) return null;

  return (
    <>
      <SubmitAppModal
        open={showSubmitAppModal}
        setOpen={setShowSubmitAppModal}
        appMetadataId={appMetadata.id}
        canSubmitAppStore={hasRequiredImagesForAppStore}
        teamId={teamId}
        appId={appId}
        isDeveloperAllowListing={appMetadata.is_developer_allow_listing}
      />
      <ConfigActionButton
        appMetadata={appMetadata}
        appId={appId}
        teamId={teamId}
        viewMode={viewMode}
        nextStep={nextStep}
        onContinue={onContinue}
        onSubmitSuccess={() => setShowSubmitAppModal(true)}
        basicInfoRef={basicInfoRef}
        onValidationError={onValidationError}
        className={clsx("shrink-0", className)}
      />
    </>
  );
};
