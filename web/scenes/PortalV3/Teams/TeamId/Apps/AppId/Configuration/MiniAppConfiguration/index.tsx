"use client";

import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQueryVariables,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { useSaveStatusActions } from "../SaveStatus";
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
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const modeUpdateInFlightRef = useRef(false);
  const saveStatus = useSaveStatusActions();

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
      saveStatus?.pushStatus("mini-app-toggle", { state: "saving" });

      // Optimistically flip the toggle immediately
      setIsMiniApp(checked);
      const newMode = checked ? "mini-app" : "external";
      try {
        const result = await updateAppMode(appMetadata.id, newMode);
        if (!result.success) {
          // Revert on failure
          setIsMiniApp(!checked);
          toast.error(result.message);
          const error = new Error(result.message);
          saveStatus?.pushStatus("mini-app-toggle", {
            state: "error",
            at: Date.now(),
            error,
            retry: () => {
              void handleAppModeToggleRef.current?.(checked);
            },
          });
        } else {
          await refetchAppMetadata();
          saveStatus?.pushStatus("mini-app-toggle", {
            state: "saved",
            at: Date.now(),
          });
        }
      } catch (err) {
        // updateAppMode can also throw (transport/server exceptions). Without
        // this catch, we'd exit through finally without ever clearing the
        // "saving" status — leaving the global indicator stuck and the
        // submit/save controls disabled until reload.
        setIsMiniApp(!checked);
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error(error.message);
        saveStatus?.pushStatus("mini-app-toggle", {
          state: "error",
          at: Date.now(),
          error,
          retry: () => {
            void handleAppModeToggleRef.current?.(checked);
          },
        });
      } finally {
        modeUpdateInFlightRef.current = false;
        setIsUpdatingMode(false);
      }
    },
    [appMetadata.id, refetchAppMetadata, setIsMiniApp, saveStatus],
  );

  const handleAppModeToggleRef = useRef<typeof handleAppModeToggle | null>(
    null,
  );
  handleAppModeToggleRef.current = handleAppModeToggle;

  const isDisabled = !isEditable || !isEnoughPermissions || isUpdatingMode;

  const modeOptions = [
    {
      value: "mini-app",
      isSelected: isMiniApp,
      label:
        "Mini App — runs inside World App, showcased in the Mini App Store",
    },
    {
      value: "external",
      isSelected: !isMiniApp,
      label: "External — your own site, World ID only",
    },
  ] as const;

  return (
    <div className="grid gap-y-5 rounded-2xl border border-grey-200 p-6">
      <Typography variant={TYPOGRAPHY.M2} className="text-grey-900">
        How does this app reach users?
      </Typography>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modeOptions.map((option) => (
          <label
            key={option.value}
            className={clsx(
              "flex cursor-pointer items-center gap-x-3 rounded-xl border p-5",
              option.isSelected ? "border-grey-900" : "border-grey-200",
              isDisabled && "cursor-default opacity-60",
            )}
          >
            <Radio
              value={option.value}
              name="app_mode"
              checked={option.isSelected}
              onChange={() => {
                if (!option.isSelected) {
                  void handleAppModeToggle(option.value === "mini-app");
                }
              }}
              disabled={isDisabled}
            />
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-900">
              {option.label}
            </Typography>
          </label>
        ))}
      </div>
    </div>
  );
};
