"use client";

import { Transition } from "@headlessui/react";
import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQueryVariables,
} from "../graphql/client/fetch-app-metadata.generated";
import { QrQuickAction } from "../BasicInformation/QrQuickAction";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { updateAppMode } from "./server/submit";

type MiniAppConfigurationProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
};

export const MiniAppConfiguration = ({
  appId,
  teamId,
  appMetadata,
}: MiniAppConfigurationProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const [showQrCode, setShowQrCode] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const modeUpdateInFlightRef = useRef(false);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isEditable = appMetadata.verification_status === "unverified";

  // Shared optimistic state: drives both this component and AppStoreForm simultaneously
  const [isMiniApp, setIsMiniApp] = useAtom(isMiniAppAtom);

  // Keep in sync when appMetadata changes (e.g. view mode switch, page refetch)
  useEffect(() => {
    setIsMiniApp(appMetadata.app_mode === "mini-app");
  }, [appMetadata.app_mode, setIsMiniApp]);

  const { refetch: refetchAppMetadata } =
    useRefetchQueries<FetchAppMetadataQueryVariables>(
      FetchAppMetadataDocument,
      { id: appId },
    );

  const handleAppModeToggle = useCallback(
    async (checked: boolean) => {
      if (modeUpdateInFlightRef.current) {
        return;
      }

      modeUpdateInFlightRef.current = true;
      setIsUpdatingMode(true);

      // Optimistically flip the toggle immediately
      setIsMiniApp(checked);
      const newMode = checked ? "mini-app" : "external";
      try {
        const result = await updateAppMode(appMetadata.id, newMode);
        if (!result.success) {
          // Revert on failure
          setIsMiniApp(!checked);
          toast.error(result.message);
        } else {
          await refetchAppMetadata();
        }
      } finally {
        modeUpdateInFlightRef.current = false;
        setIsUpdatingMode(false);
      }
    },
    [appMetadata.id, refetchAppMetadata, setIsMiniApp],
  );

  const { url, showDraftMiniAppFlag } = useMemo(() => {
    let url = `https://world.org/mini-app?app_id=${appId}&path=`;
    const showDraftMiniAppFlag = appMetadata.verification_status !== "verified";
    if (showDraftMiniAppFlag) {
      url += `&draft_id=${appMetadata.id}`;
    }
    return { url, showDraftMiniAppFlag };
  }, [appId, appMetadata]);

  return (
    <div className="flex max-w-[700px] flex-col gap-5">
      <Typography variant={TYPOGRAPHY.H7} className="font-normal text-grey-900">
        Mini App Configuration
      </Typography>

      <div className="grid grid-cols-1 gap-y-10">
        {/* This is a Mini App toggle */}
        <div className="rounded-[10px] border border-grey-100 px-6 py-4">
          <div className="flex items-center gap-x-4">
            <div className="grid flex-1 gap-y-1">
              <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
                This is a Mini App
              </Typography>
              <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                Check this if you have integrated mini-kit into your app and
                want it to load as a mini-app. Your app will be rejected if this
                is not true.
              </Typography>
            </div>
            <Toggle
              checked={isMiniApp}
              onChange={handleAppModeToggle}
              disabled={!isEditable || !isEnoughPermissions || isUpdatingMode}
            />
          </div>
        </div>

        {/* Activate QR code toggle — mini-app only */}
        {isMiniApp && !!appMetadata.integration_url && (
          <div className="grid gap-y-10">
            <div className="rounded-[10px] border border-grey-100 px-6 py-4">
              <div className="flex items-center gap-x-4">
                <div className="grid flex-1 gap-y-1">
                  <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
                    Activate the QR code
                  </Typography>
                  <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                    Show QR code in your app for users to try it out.
                  </Typography>
                </div>
                <Toggle checked={showQrCode} onChange={setShowQrCode} />
              </div>
            </div>

            <Transition
              show={showQrCode}
              as={Fragment}
              enter="transition-all duration-200 ease-out"
              enterFrom="opacity-0 -translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition-all duration-150 ease-in"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-1"
            >
              <div className="flex justify-center sm:justify-start">
                <QrQuickAction
                  url={url}
                  showDraftMiniAppFlag={showDraftMiniAppFlag}
                />
              </div>
            </Transition>
          </div>
        )}
      </div>
    </div>
  );
};
