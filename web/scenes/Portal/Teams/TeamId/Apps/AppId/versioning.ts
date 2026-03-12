import { urls } from "@/lib/urls";

export const APP_VERSION_QUERY_PARAM = "version" as const;

export type AppVersionParam = "current" | "approved";
export type AppViewMode = "unverified" | "verified";

export const isAppVersionParam = (
  value: string | null | undefined,
): value is AppVersionParam => {
  return value === "current" || value === "approved";
};

type ResolveAppVersionParams = {
  requestedVersion: string | null | undefined;
  hasDraft: boolean;
  hasVerified: boolean;
};

type AppendVersionParamParams = {
  path: string;
  version: AppVersionParam;
  hasDraft: boolean;
  hasVerified: boolean;
};

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

type RecordSearchParams = Record<string, string | string[] | undefined>;

type MiniAppNavStateParams = {
  teamId: string;
  appId: string;
  pathname: string | null | undefined;
  searchParams: SearchParamsLike | null | undefined;
  hasDraft: boolean;
  hasVerified: boolean;
};

const getSearchParamValue = (
  searchParams: SearchParamsLike | RecordSearchParams | null | undefined,
  key: string,
): string | null => {
  if (!searchParams) {
    return null;
  }

  if ("get" in searchParams && typeof searchParams.get === "function") {
    return searchParams.get(key);
  }

  const value = (searchParams as RecordSearchParams)[key];
  return typeof value === "string" ? value : null;
};

export const resolveAppVersionParam = ({
  requestedVersion,
  hasDraft,
  hasVerified,
}: ResolveAppVersionParams): AppVersionParam => {
  if (!hasDraft && hasVerified) {
    return "approved";
  }

  if (!hasVerified) {
    return "current";
  }

  return requestedVersion === "approved" ? "approved" : "current";
};

export const getViewModeFromVersionParam = (
  version: AppVersionParam,
): AppViewMode => {
  return version === "approved" ? "verified" : "unverified";
};

export const getVersionParamFromViewMode = (
  viewMode: AppViewMode,
): AppVersionParam => {
  return viewMode === "verified" ? "approved" : "current";
};

export const appendVersionParam = ({
  path,
  version,
  hasDraft,
  hasVerified,
}: AppendVersionParamParams): string => {
  const [pathnameAndSearch, hash = ""] = path.split("#");
  const [pathname, search = ""] = pathnameAndSearch.split("?");
  const searchParams = new URLSearchParams(search);
  const shouldPersistVersion = hasDraft && hasVerified;

  if (shouldPersistVersion) {
    searchParams.set(APP_VERSION_QUERY_PARAM, version);
  } else {
    searchParams.delete(APP_VERSION_QUERY_PARAM);
  }

  const query = searchParams.toString();

  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

export const appendExplicitVersionParam = (
  path: string,
  requestedVersion: string | null | undefined,
): string => {
  if (!isAppVersionParam(requestedVersion)) {
    return path;
  }

  const [pathnameAndSearch, hash = ""] = path.split("#");
  const [pathname, search = ""] = pathnameAndSearch.split("?");
  const searchParams = new URLSearchParams(search);

  searchParams.set(APP_VERSION_QUERY_PARAM, requestedVersion);

  const query = searchParams.toString();

  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

export const getRequestedVersion = (
  searchParams: SearchParamsLike | RecordSearchParams | null | undefined,
): string | null => getSearchParamValue(searchParams, APP_VERSION_QUERY_PARAM);

export const getCurrentPathWithSearch = (
  pathname: string | null | undefined,
  searchParams: Pick<SearchParamsLike, "toString"> | null | undefined,
): string => {
  const search = searchParams?.toString() ?? "";
  return `${pathname ?? ""}${search ? `?${search}` : ""}`;
};

export const getSelectedAppVersion = ({
  hasDraft,
  hasVerified,
  searchParams,
}: {
  hasDraft: boolean;
  hasVerified: boolean;
  searchParams: SearchParamsLike | RecordSearchParams | null | undefined;
}): AppVersionParam =>
  resolveAppVersionParam({
    requestedVersion: getRequestedVersion(searchParams),
    hasDraft,
    hasVerified,
  });

export const getPathWithExplicitVersion = (
  path: string,
  searchParams: SearchParamsLike | RecordSearchParams | null | undefined,
): string =>
  appendExplicitVersionParam(path, getRequestedVersion(searchParams));

export const getMiniAppNavState = ({
  teamId,
  appId,
  pathname,
  searchParams,
  hasDraft,
  hasVerified,
}: MiniAppNavStateParams) => {
  const version = getSelectedAppVersion({
    hasDraft,
    hasVerified,
    searchParams,
  });
  const currentPath = getCurrentPathWithSearch(pathname, searchParams);
  const permissionsBasePath = urls.miniAppPermissions({
    team_id: teamId,
    app_id: appId,
  });
  const transactionsBasePath = urls.miniAppTransactions({
    team_id: teamId,
    app_id: appId,
  });
  const notificationsBasePath = urls.miniAppNotifications({
    team_id: teamId,
    app_id: appId,
  });
  const permissionsPath = appendVersionParam({
    path: permissionsBasePath,
    version,
    hasDraft,
    hasVerified,
  });
  const transactionsPath = appendVersionParam({
    path: transactionsBasePath,
    version,
    hasDraft,
    hasVerified,
  });
  const notificationsPath = appendVersionParam({
    path: notificationsBasePath,
    version,
    hasDraft,
    hasVerified,
  });

  return {
    version,
    currentPath,
    permissionsPath,
    transactionsPath,
    notificationsPath,
    isPermissionsActive:
      pathname === permissionsBasePath || currentPath === permissionsPath,
    isTransactionsActive:
      pathname === transactionsBasePath || currentPath === transactionsPath,
    isNotificationsActive:
      pathname === notificationsBasePath || currentPath === notificationsPath,
  };
};
