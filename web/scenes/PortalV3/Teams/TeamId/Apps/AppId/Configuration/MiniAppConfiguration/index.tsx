"use client";

import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useApolloClient } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { useSaveStatusActions } from "../SaveStatus";
import { updateAppMode } from "./server/submit";

type MiniAppConfigurationProps = {
  teamId: string;
  appMetadata: AppMetadata;
};

/**
 * Owns the app-mode toggle: optimistic `isMiniAppAtom` flip, the
 * `updateAppMode` server action with revert-on-failure, and save-status
 * reporting under id "mini-app-toggle". Shared between the card below and the
 * configuration wizard's designed mode selector.
 */
export const useAppModeToggle = ({
  teamId,
  appMetadata,
}: MiniAppConfigurationProps) => {
  const apolloClient = useApolloClient();
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
          // The server action has already persisted the row. Updating the
          // normalized cache keeps every metadata consumer current without
          // refetching the page query, which would replace the wizard with its
          // loading skeleton and look like a full-page refresh.
          const cacheId = apolloClient.cache.identify({
            __typename: "app_metadata",
            id: appMetadata.id,
          });
          if (cacheId) {
            apolloClient.cache.modify({
              id: cacheId,
              fields: {
                app_mode: () => newMode,
                ...(newMode === "mini-app" && {
                  category: (existingCategory: string) =>
                    existingCategory === "External"
                      ? "Other"
                      : existingCategory,
                }),
              },
            });
          }
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
    [apolloClient.cache, appMetadata.id, setIsMiniApp, saveStatus],
  );

  const handleAppModeToggleRef = useRef<typeof handleAppModeToggle | null>(
    null,
  );
  handleAppModeToggleRef.current = handleAppModeToggle;

  const isDisabled = !isEditable || !isEnoughPermissions || isUpdatingMode;

  return { isMiniApp, isDisabled, handleAppModeToggle };
};

export const MiniAppConfiguration = (props: MiniAppConfigurationProps) => {
  const { isMiniApp, isDisabled, handleAppModeToggle } =
    useAppModeToggle(props);

  const modeOptions = [
    {
      value: "mini-app",
      isSelected: isMiniApp,
      label: "Mini App",
    },
    {
      value: "external",
      isSelected: !isMiniApp,
      label: "External Integration",
    },
  ] as const;

  return (
    <div className="@container grid min-w-0 content-start gap-y-5 rounded-2xl border border-grey-200 bg-grey-0 p-6 shadow-button">
      <Typography variant={TYPOGRAPHY.M2} className="text-grey-900">
        How does this app reach users?
      </Typography>

      {/* This card sits inside the portal sidebar and configuration rails, so
          its columns must respond to card width rather than viewport width. */}
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        {modeOptions.map((option) => (
          <label
            key={option.value}
            className={clsx(
              "flex min-w-0 cursor-pointer items-center gap-x-3 rounded-xl border p-5 transition-colors",
              option.isSelected
                ? "border-blue-500 bg-blue-50"
                : "border-grey-200 hover:border-grey-300",
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
              className="shrink-0"
            />
            <Typography
              variant={TYPOGRAPHY.R4}
              className="min-w-0 break-words text-grey-900"
            >
              {option.label}
            </Typography>
          </label>
        ))}
      </div>
    </div>
  );
};
