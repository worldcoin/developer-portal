"use client";

import { urls } from "@/lib/urls";
import { useAtom } from "jotai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { viewModeAtom } from "./Configuration/layout/ImagesProvider";
import {
  appendVersionParam,
  AppVersionParam,
  AppViewMode,
  getCurrentPathWithSearch,
  getVersionParamFromViewMode,
  getViewModeFromVersionParam,
  getSelectedAppVersion,
  resolveAppVersionParam,
} from "./versioning";

type UseAppVersionModeParams = {
  hasDraft: boolean;
  hasVerified: boolean;
  hasDraftMiniApp?: boolean;
  hasVerifiedMiniApp?: boolean;
  teamId?: string;
  appId?: string;
};

type SetViewModeOptions = {
  hasDraft?: boolean;
  hasVerified?: boolean;
  hasDraftMiniApp?: boolean;
  hasVerifiedMiniApp?: boolean;
};

export const useAppVersionMode = ({
  hasDraft,
  hasVerified,
  hasDraftMiniApp = false,
  hasVerifiedMiniApp = false,
  teamId,
  appId,
}: UseAppVersionModeParams) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedViewMode, setStoredViewMode] = useAtom(viewModeAtom);

  const version = useMemo(
    () =>
      getSelectedAppVersion({
        hasDraft,
        hasVerified,
        searchParams,
      }),
    [hasDraft, hasVerified, searchParams],
  );

  const viewMode = useMemo(
    () => getViewModeFromVersionParam(version),
    [version],
  );

  useLayoutEffect(() => {
    if (storedViewMode !== viewMode) {
      setStoredViewMode(viewMode);
    }
  }, [setStoredViewMode, storedViewMode, viewMode]);

  const setViewMode = useCallback(
    (nextViewMode: AppViewMode, options?: SetViewModeOptions) => {
      const nextHasDraft = options?.hasDraft ?? hasDraft;
      const nextHasVerified = options?.hasVerified ?? hasVerified;
      const nextHasDraftMiniApp = options?.hasDraftMiniApp ?? hasDraftMiniApp;
      const nextHasVerifiedMiniApp =
        options?.hasVerifiedMiniApp ?? hasVerifiedMiniApp;
      const nextVersion = resolveAppVersionParam({
        requestedVersion: getVersionParamFromViewMode(nextViewMode),
        hasDraft: nextHasDraft,
        hasVerified: nextHasVerified,
      });
      const nextPath = getCurrentPathWithSearch(pathname, searchParams);
      const isMiniAppRoute =
        pathname.includes("/mini-app") ||
        pathname.endsWith("/transactions") ||
        pathname.endsWith("/notifications");
      const isMiniAppEnabledForNextVersion =
        nextVersion === "approved"
          ? nextHasVerifiedMiniApp
          : nextHasDraftMiniApp;

      setStoredViewMode(getViewModeFromVersionParam(nextVersion));

      if (
        isMiniAppRoute &&
        !isMiniAppEnabledForNextVersion &&
        teamId &&
        appId
      ) {
        router.replace(
          appendVersionParam({
            path: urls.configuration({
              team_id: teamId,
              app_id: appId,
            }),
            version: nextVersion,
            hasDraft: nextHasDraft,
            hasVerified: nextHasVerified,
          }),
        );
        return;
      }

      router.replace(
        appendVersionParam({
          path: nextPath,
          version: nextVersion,
          hasDraft: nextHasDraft,
          hasVerified: nextHasVerified,
        }),
      );
    },
    [
      appId,
      hasDraft,
      hasDraftMiniApp,
      hasVerified,
      hasVerifiedMiniApp,
      pathname,
      router,
      searchParams,
      setStoredViewMode,
      teamId,
    ],
  );

  const getVersionedPath = useCallback(
    (path: string, nextVersion?: AppVersionParam) =>
      appendVersionParam({
        path,
        version: nextVersion ?? version,
        hasDraft,
        hasVerified,
      }),
    [hasDraft, hasVerified, version],
  );

  return {
    version,
    viewMode,
    setViewMode,
    getVersionedPath,
  };
};
