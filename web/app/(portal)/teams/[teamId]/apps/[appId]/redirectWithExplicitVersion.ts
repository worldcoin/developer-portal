import { getPathWithExplicitVersion } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/versioning";
import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined> | undefined;

export const redirectWithExplicitVersion = (
  path: string,
  searchParams?: SearchParams,
) => {
  redirect(getPathWithExplicitVersion(path, searchParams));
};
